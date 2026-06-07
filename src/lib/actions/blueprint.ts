"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { BlueprintDraft } from "@/lib/utils/blueprint-types"

// ── Validation ────────────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const IMPACT_TO_WEIGHT = { supporting: 1, important: 2, critical: 3 } as const

const monthlyGoalSchema = z.object({
  tempId:       z.string().min(1),
  title:        z.string().min(1, "Monthly milestone title is required").max(200),
  description:  z.string().max(2000),
  month_start:  z.string().regex(ISO_DATE_RE, "month_start must be YYYY-MM-DD"),
  target_value: z.number().positive().optional(),
  target_unit:  z.string().max(50).optional(),
  impactLevel:  z.enum(["supporting", "important", "critical"]),
  weight:       z.union([z.literal(1), z.literal(2), z.literal(3)]),
  reasoning:    z.string().max(2000),
})

const weeklyGoalSchema = z.object({
  tempId:        z.string().min(1),
  monthlyTempId: z.string().min(1),
  title:         z.string().min(1, "Weekly goal title is required").max(200),
  description:   z.string().max(2000),
  week_start:    z.string().regex(ISO_DATE_RE, "week_start must be YYYY-MM-DD"),
  target_value:  z.number().positive().optional(),
  target_unit:   z.string().max(50).optional(),
  reasoning:     z.string().max(2000),
})

const blueprintSchema = z
  .object({
    longTermGoal: z.object({
      title:       z.string().min(1, "Goal title is required").max(200),
      description: z.string().max(2000),
      deadline:    z.string().regex(ISO_DATE_RE, "Deadline must be YYYY-MM-DD"),
      category:    z.string().max(50).optional(),
    }),
    monthlyGoals: z
      .array(monthlyGoalSchema)
      .min(1, "At least one monthly milestone is required")
      .max(8, "Maximum 8 monthly milestones"),
    weeklyGoals: z.array(weeklyGoalSchema).max(8, "Maximum 8 weekly goals"),
  })
  .superRefine((data, ctx) => {
    // impactLevel and weight must be consistent
    for (const mg of data.monthlyGoals) {
      if (IMPACT_TO_WEIGHT[mg.impactLevel] !== mg.weight) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Monthly milestone "${mg.title}" has mismatched impact level and weight.`,
          path: ["monthlyGoals"],
        })
      }
    }

    // Monthly tempIds must be unique
    const monthlyIds = data.monthlyGoals.map((mg) => mg.tempId)
    if (new Set(monthlyIds).size !== monthlyIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Monthly milestone IDs must be unique.",
        path: ["monthlyGoals"],
      })
    }

    // Weekly tempIds must be unique
    const weeklyIds = data.weeklyGoals.map((wg) => wg.tempId)
    if (new Set(weeklyIds).size !== weeklyIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Weekly goal IDs must be unique.",
        path: ["weeklyGoals"],
      })
    }

    // Every weeklyGoal.monthlyTempId must reference a real monthly tempId
    const monthlyIdSet = new Set(monthlyIds)
    for (const wg of data.weeklyGoals) {
      if (!monthlyIdSet.has(wg.monthlyTempId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Weekly goal "${wg.title}" references an invalid monthly milestone.`,
          path: ["weeklyGoals"],
        })
      }
    }
  })

// ── Category mapping ──────────────────────────────────────────────────────────
// Blueprint categories come from AI as free-form strings (Title Case).
// The goals table requires one of the app's lowercase DB category values.

const CATEGORY_MAP: Record<string, string> = {
  career:    "career",
  fitness:   "fitness",
  finance:   "finance",
  learning:  "education",
  health:    "other",
  creative:  "other",
  personal:  "personal",
  education: "education",
  project:   "project",
  other:     "other",
}

function mapGoalCategory(raw?: string): string {
  if (!raw) return "other"
  return CATEGORY_MAP[raw.toLowerCase().trim()] ?? "other"
}

// ── Server action ─────────────────────────────────────────────────────────────

export async function lockInBlueprint(
  blueprint: BlueprintDraft,
): Promise<{ success: true; goalId: string } | { success: false; error: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "You must be signed in to save a blueprint." }
  }
  const userId = user.id

  // Validate the full blueprint before touching the DB.
  const parsed = blueprintSchema.safeParse(blueprint)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { longTermGoal, monthlyGoals, weeklyGoals } = parsed.data

  // Track inserted IDs so a mid-flight failure can roll back all rows we own.
  let insertedGoalId: string | null = null
  const insertedMonthlyIds: string[] = []
  const insertedWeeklyIds:  string[] = []

  async function cleanup() {
    if (insertedWeeklyIds.length > 0) {
      await supabase
        .from("weekly_tasks")
        .delete()
        .in("id", insertedWeeklyIds)
        .eq("user_id", userId)
    }
    if (insertedMonthlyIds.length > 0) {
      await supabase
        .from("monthly_goals")
        .delete()
        .in("id", insertedMonthlyIds)
        .eq("user_id", userId)
    }
    if (insertedGoalId) {
      await supabase
        .from("goals")
        .delete()
        .eq("id", insertedGoalId)
        .eq("user_id", userId)
    }
  }

  // ── Step 1: Insert long-term goal ─────────────────────────────────────────

  const { data: goalRow, error: goalError } = await supabase
    .from("goals")
    .insert({
      user_id:      userId,
      title:        longTermGoal.title.trim(),
      description:  longTermGoal.description?.trim() || null,
      category:     mapGoalCategory(longTermGoal.category),
      target_date:  longTermGoal.deadline,
      status:       "active",
      progress_pct: 0,
    })
    .select("id")
    .single()

  if (goalError || !goalRow) {
    console.error("[lockInBlueprint] goal insert failed:", goalError)
    return { success: false, error: "Could not create the long-term goal. Please try again." }
  }
  insertedGoalId = goalRow.id

  // ── Step 2: Insert monthly milestones; build tempId → real id map ─────────

  const tempIdToRealId = new Map<string, string>()

  for (const mg of monthlyGoals) {
    const { data: mgRow, error: mgError } = await supabase
      .from("monthly_goals")
      .insert({
        user_id:      userId,
        goal_id:      insertedGoalId,
        month_start:  mg.month_start,
        title:        mg.title.trim(),
        description:  mg.description?.trim() || null,
        category:     null,
        status:       "active",
        weight:       mg.weight,
        target_value: mg.target_value ?? null,
        target_unit:  mg.target_unit?.trim() || null,
        progress_pct: 0,
      })
      .select("id")
      .single()

    if (mgError || !mgRow) {
      console.error("[lockInBlueprint] monthly_goals insert failed:", mgError, "\npayload:", mg)
      await cleanup()
      return {
        success: false,
        error: "Could not save the full blueprint. Nothing was saved. Please try again.",
      }
    }

    insertedMonthlyIds.push(mgRow.id)
    tempIdToRealId.set(mg.tempId, mgRow.id)
  }

  // ── Step 3: Insert weekly goals ───────────────────────────────────────────

  for (const wg of weeklyGoals) {
    const realMonthlyId = tempIdToRealId.get(wg.monthlyTempId)
    if (!realMonthlyId) {
      // Guard: should not be reachable after superRefine validation.
      await cleanup()
      return {
        success: false,
        error: "Could not save the full blueprint. Nothing was saved. Please try again.",
      }
    }

    const { data: wgRow, error: wgError } = await supabase
      .from("weekly_tasks")
      .insert({
        user_id:         userId,
        monthly_goal_id: realMonthlyId,
        goal_id:         null,
        group_id:        null,
        week_start:      wg.week_start,
        title:           wg.title.trim(),
        description:     wg.description?.trim() || null,
        category:        null,
        priority:        "medium",
        target_value:    wg.target_value ?? null,
        target_unit:     wg.target_unit?.trim() || null,
        due_date:        null,
        current_value:   0,
        progress:        0,
        status:          "pending",
      })
      .select("id")
      .single()

    if (wgError || !wgRow) {
      console.error("[lockInBlueprint] weekly_tasks insert failed:", wgError, "\npayload:", wg)
      await cleanup()
      return {
        success: false,
        error: "Could not save the full blueprint. Nothing was saved. Please try again.",
      }
    }

    insertedWeeklyIds.push(wgRow.id)
  }

  // ── Step 4: Revalidate and return ─────────────────────────────────────────

  revalidatePath("/goals")
  revalidatePath(`/goals/${insertedGoalId}`)
  revalidatePath("/dashboard")

  return { success: true, goalId: insertedGoalId }
}
