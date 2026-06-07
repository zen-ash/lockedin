"use server"

import { z } from "zod"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"
import {
  suggestMonthlyGoalWeightHeuristic,
} from "@/lib/utils/weight-suggestions"
import type { WeightSuggestion } from "@/lib/utils/weight-suggestions"
import { generateFallbackBlueprint } from "@/lib/utils/blueprint-fallback"
import type {
  BlueprintInput,
  BlueprintDraft,
  BlueprintGenerationResult,
} from "@/lib/utils/blueprint-types"

// ── Shared model ──────────────────────────────────────────────────────────────
// Change OPENAI_MODEL env var to use a different model; no code change needed.

const AI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini"

// ═══════════════════════════════════════════════════════════════════════════════
// suggestMonthlyGoalWeight
// ═══════════════════════════════════════════════════════════════════════════════

const suggestWeightInputSchema = z.object({
  goal_id:      z.string().uuid("Invalid goal ID"),
  title:        z.string().min(1, "Title is required").max(300),
  description:  z.string().max(1000).optional(),
  target_value: z.number().positive().optional(),
  target_unit:  z.string().max(50).optional(),
  month_start:  z.string().optional(),
})

const weightAiOutputSchema = z.object({
  weight:     z.union([z.literal(1), z.literal(2), z.literal(3)]),
  confidence: z.enum(["low", "medium", "high"]),
  reasoning:  z.string().max(300),
})

const WEIGHT_SYSTEM_PROMPT = `You are an expert project manager helping calibrate goal weights in a deterministic productivity app.

Your job: Given a parent long-term goal and a draft monthly goal, estimate how much the monthly goal should count toward the parent goal compared with sibling monthly goals.

Weight scale:
1 = supporting / lower impact (passive learning, research, planning)
2 = important (skill building, practice, meaningful execution)
3 = critical / high impact (direct execution toward the outcome)

Rules:
- Weight must be exactly 1, 2, or 3 — no other values allowed
- Direct execution toward the goal outcome should score higher than passive preparation
- Do not overrate passive learning or research activities
- If context is weak or unclear, choose weight 1 and mark confidence as low
- Reasoning must be one short sentence under 20 words
- Return only structured JSON matching the schema exactly`

export async function suggestMonthlyGoalWeight(
  raw: unknown,
): Promise<WeightSuggestion | { error: string }> {
  // 1. Validate input
  const parsed = suggestWeightInputSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: "Invalid input — make sure a goal and title are provided." }
  }
  const input = parsed.data

  // Trim strings after validation
  const title       = input.title.trim()
  const description = input.description?.trim() || undefined
  const targetUnit  = input.target_unit?.trim() || undefined

  // 2. Authenticate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  // 3. Fetch parent goal — must belong to the authenticated user
  const { data: parentGoal } = await supabase
    .from("goals")
    .select("id, title, description, category, status")
    .eq("id", input.goal_id)
    .eq("user_id", user.id)
    .single()

  if (!parentGoal) return { error: "Goal not found or access denied." }

  // 4. Fetch sibling monthly goals for context
  const { data: siblings } = await supabase
    .from("monthly_goals")
    .select("title, weight, month_start, status")
    .eq("goal_id", input.goal_id)
    .eq("user_id", user.id)
    .order("month_start", { ascending: true })

  // 5. Try AI, fall back to deterministic heuristic
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured")
    }

    const siblingLines =
      siblings && siblings.length > 0
        ? siblings
            .map(
              (s) =>
                `- "${s.title}" (weight ${s.weight}, ${s.month_start}, ${s.status})`,
            )
            .join("\n")
        : "None yet."

    const userPrompt = [
      `Parent long-term goal:`,
      `Title: "${parentGoal.title}"`,
      parentGoal.description
        ? `Description: "${parentGoal.description.slice(0, 400)}"`
        : null,
      parentGoal.category ? `Category: ${parentGoal.category}` : null,
      ``,
      `Existing sibling monthly goals:`,
      siblingLines,
      ``,
      `Draft monthly goal to calibrate:`,
      `Title: "${title}"`,
      description ? `Description: "${description.slice(0, 400)}"` : null,
      input.target_value != null
        ? `Target: ${input.target_value}${targetUnit ? ` ${targetUnit}` : ""}`
        : null,
      input.month_start ? `Month: ${input.month_start}` : null,
      ``,
      `Suggest a weight of 1, 2, or 3 for this monthly goal.`,
    ]
      .filter(Boolean)
      .join("\n")

    const result = await generateObject({
      model:  openai(AI_MODEL),
      schema: weightAiOutputSchema,
      system: WEIGHT_SYSTEM_PROMPT,
      prompt: userPrompt,
    })

    return {
      weight:     result.object.weight,
      confidence: result.object.confidence,
      reasoning:  result.object.reasoning,
      source:     "ai",
    }
  } catch (err) {
    console.error("[suggestMonthlyGoalWeight] AI call failed:", err)
    // Graceful fallback to deterministic heuristic
    return suggestMonthlyGoalWeightHeuristic({
      title,
      description,
      parentGoalTitle:    parentGoal.title,
      parentGoalCategory: parentGoal.category ?? undefined,
    })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// generateGoalBlueprint
// ═══════════════════════════════════════════════════════════════════════════════

// ── Input schema ──────────────────────────────────────────────────────────────

const blueprintInputSchema = z.object({
  goalTitle: z
    .string()
    .min(1, "Goal title is required")
    .max(300, "Goal title is too long"),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .max(30)
    .refine((v) => !isNaN(Date.parse(v)), { message: "Deadline must be a valid date" }),
  weeklyAvailabilityHours: z
    .number()
    .min(1, "At least 1 hour per week is required")
    .max(80, "Maximum 80 hours per week"),
  goalDescription:    z.string().max(2000).optional(),
  category:           z.string().max(50).optional(),
  currentLevel:       z.string().max(1000).optional(),
  preferredStartDate: z.string().max(30).optional(),
})

// ── AI output schema ──────────────────────────────────────────────────────────

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const blueprintAiOutputSchema = z.object({
  longTermGoal: z.object({
    title:       z.string().min(1).max(300),
    description: z.string().min(1).max(2000),
    deadline:    z.string().regex(ISO_DATE_REGEX, "Must be YYYY-MM-DD"),
    // nullable (not optional) — OpenAI strict structured outputs require every key present
    category:    z.string().max(50).nullable(),
  }),
  monthlyGoals: z
    .array(
      z.object({
        tempId:       z.string().min(1).max(30),
        title:        z.string().min(1).max(300),
        description:  z.string().min(1).max(1000),
        month_start:  z.string().regex(ISO_DATE_REGEX, "Must be YYYY-MM-DD"),
        target_value: z.number().positive().nullable(),
        target_unit:  z.string().max(50).nullable(),
        impactLevel:  z.enum(["supporting", "important", "critical"]),
        weight:       z.union([z.literal(1), z.literal(2), z.literal(3)]),
        reasoning:    z.string().min(1).max(300),
      }),
    )
    .min(2)
    .max(8),
  weeklyGoals: z
    .array(
      z.object({
        tempId:        z.string().min(1).max(30),
        monthlyTempId: z.string().min(1).max(30),
        title:         z.string().min(1).max(300),
        description:   z.string().min(1).max(1000),
        week_start:    z.string().regex(ISO_DATE_REGEX, "Must be YYYY-MM-DD"),
        target_value:  z.number().positive().nullable(),
        target_unit:   z.string().max(50).nullable(),
        reasoning:     z.string().min(1).max(300),
      }),
    )
    .min(1)
    .max(8),
  summary:     z.string().min(1).max(1000),
  assumptions: z.string().min(1).max(1000),
  confidence:  z.enum(["low", "medium", "high"]),
})

// ── Post-AI consistency validation ────────────────────────────────────────────

function isAiBlueprintValid(
  obj: z.infer<typeof blueprintAiOutputSchema>,
): boolean {
  const WEIGHT_TO_IMPACT: Record<number, string> = {
    1: "supporting",
    2: "important",
    3: "critical",
  }

  for (const mg of obj.monthlyGoals) {
    if (mg.impactLevel !== WEIGHT_TO_IMPACT[mg.weight]) return false
  }

  const monthlyTempIds = new Set(obj.monthlyGoals.map((mg) => mg.tempId))
  for (const wg of obj.weeklyGoals) {
    if (!monthlyTempIds.has(wg.monthlyTempId)) return false
  }

  return true
}

// ── Deadline normalizer ───────────────────────────────────────────────────────

function toYYYYMMDD(val: string): string {
  if (/^\d{4}-\d{2}$/.test(val)) return `${val}-01`
  if (ISO_DATE_REGEX.test(val)) return val
  const d = new Date(`${val}T12:00:00Z`)
  return isNaN(d.getTime()) ? val : d.toISOString().split("T")[0]
}

// ── System prompt ─────────────────────────────────────────────────────────────

const BLUEPRINT_SYSTEM_PROMPT = `You are an expert project planner inside LOCKEDIN, a deterministic goal execution app.

Your job is to convert one long-term ambition into a practical blueprint:
- long-term goal
- monthly goals
- current week goals
- impact levels

The user should not need to manually decide weights or create every layer.

Use this impact mapping:
- supporting = weight 1
- important = weight 2
- critical = weight 3

Make the plan concrete, measurable, and realistic for the user's weekly availability.

The current date is provided as currentDate. Use it as the reference point for generating month_start and week_start values. Do not guess today's date.

Do not create vague goals like "work hard" or "stay motivated."
Prefer measurable targets:
- applications sent
- LeetCode problems solved
- recruiter messages sent
- portfolio hours
- workouts completed
- dollars saved
- pages read

For career/internship goals:
Direct outcome work like applying, networking, interviewing, portfolio shipping, and resume optimization should usually be higher impact than passive learning.
Do not overrate watching videos or reading courses.

Generate only the current week's weekly goals, not every week until the deadline.
Future weekly planning will be handled in a later phase.

All generated dates must be plain ISO date strings in YYYY-MM-DD format.
Do not return relative dates like "next Monday," "March 2027," or Unix timestamps.
month_start must be the first day of a month (e.g., 2026-07-01).
week_start must be a Monday.

Return only structured data matching the schema.`

// ── Server action ─────────────────────────────────────────────────────────────

export async function generateGoalBlueprint(
  raw: unknown,
): Promise<BlueprintGenerationResult> {
  // 1. Validate input
  const parsed = blueprintInputSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: "Invalid input — check all required fields and try again." }
  }
  const data = parsed.data

  // 2. Authenticate — required even though no DB write happens
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      success: false,
      error: "You must be signed in to generate a blueprint.",
    }
  }

  // 3. Generate currentDate server-side — never trust the model to know today
  const currentDate = new Date().toISOString().split("T")[0]

  // 4. Normalize and cap strings
  const goalTitle              = data.goalTitle.trim().slice(0, 300)
  const normalizedDeadline     = toYYYYMMDD(data.deadline)
  const goalDescription        = data.goalDescription?.trim().slice(0, 2000) || undefined
  const category               = data.category?.trim().slice(0, 50) || undefined
  const currentLevel           = data.currentLevel?.trim().slice(0, 1000) || undefined
  const weeklyAvailabilityHours = data.weeklyAvailabilityHours

  // 5. Shared input for fallback generator
  const blueprintInput: BlueprintInput = {
    goalTitle,
    deadline:               normalizedDeadline,
    weeklyAvailabilityHours,
    goalDescription,
    category,
    currentLevel,
    preferredStartDate: data.preferredStartDate,
  }

  // 6. If no API key, return fallback immediately
  if (!process.env.OPENAI_API_KEY) {
    try {
      const blueprint = generateFallbackBlueprint(blueprintInput, currentDate)
      return {
        success: true,
        blueprint,
        message: "Using a local starter blueprint because AI generation is unavailable.",
      }
    } catch {
      return {
        success: false,
        error: "Blueprint generation failed. Please try again.",
      }
    }
  }

  // 7. Try AI generation
  try {
    const userPrompt = [
      `Current date: ${currentDate}`,
      ``,
      `User's long-term ambition:`,
      `Title: "${goalTitle}"`,
      goalDescription ? `Description: "${goalDescription.slice(0, 800)}"` : null,
      category ? `Category: ${category}` : null,
      currentLevel ? `Context / Current Level: "${currentLevel.slice(0, 500)}"` : null,
      ``,
      `Deadline: ${normalizedDeadline}`,
      `Weekly availability: ${weeklyAvailabilityHours} hours per week`,
      ``,
      `Generate a complete blueprint with:`,
      `- A refined long-term goal (title, description, deadline, category)`,
      `- Monthly goals spanning today to the deadline (2–8 goals)`,
      `- Only the current week's weekly goals (1–8 goals)`,
      ``,
      `Use tempId values: "monthly_1", "monthly_2", etc.`,
      `Use tempId values: "weekly_1", "weekly_2", etc.`,
      `Each weeklyGoal.monthlyTempId must exactly match a monthly goal tempId.`,
      ``,
      `Impact mapping: supporting = weight 1, important = weight 2, critical = weight 3.`,
      `All date fields must be YYYY-MM-DD format only.`,
      `month_start must be the first day of a month (e.g., 2026-07-01).`,
      `week_start must be a Monday. The Monday of the current week starts on or before ${currentDate}.`,
    ]
      .filter(Boolean)
      .join("\n")

    const result = await generateObject({
      model:  openai(AI_MODEL),
      schema: blueprintAiOutputSchema,
      system: BLUEPRINT_SYSTEM_PROMPT,
      prompt: userPrompt,
    })

    // 8. Post-AI consistency validation (impact/weight + temp ID refs)
    if (!isAiBlueprintValid(result.object)) {
      throw new Error("Blueprint failed consistency validation")
    }

    // Normalize null → undefined to match BlueprintDraft's optional fields
    const blueprint: BlueprintDraft = {
      longTermGoal: {
        title:       result.object.longTermGoal.title,
        description: result.object.longTermGoal.description,
        deadline:    result.object.longTermGoal.deadline,
        category:    result.object.longTermGoal.category ?? undefined,
      },
      monthlyGoals: result.object.monthlyGoals.map((mg) => ({
        tempId:       mg.tempId,
        title:        mg.title,
        description:  mg.description,
        month_start:  mg.month_start,
        target_value: mg.target_value ?? undefined,
        target_unit:  mg.target_unit ?? undefined,
        impactLevel:  mg.impactLevel,
        weight:       mg.weight,
        reasoning:    mg.reasoning,
      })),
      weeklyGoals: result.object.weeklyGoals.map((wg) => ({
        tempId:        wg.tempId,
        monthlyTempId: wg.monthlyTempId,
        title:         wg.title,
        description:   wg.description,
        week_start:    wg.week_start,
        target_value:  wg.target_value ?? undefined,
        target_unit:   wg.target_unit ?? undefined,
        reasoning:     wg.reasoning,
      })),
      summary:      result.object.summary,
      assumptions:  result.object.assumptions,
      source:       "ai",
      confidence:   result.object.confidence,
    }

    return { success: true, blueprint }
  } catch (err) {
    // Log the real error to server console so it can be diagnosed
    console.error("[generateGoalBlueprint] AI call failed:", err)
    // Graceful fallback — raw errors never reach the client
    try {
      const blueprint = generateFallbackBlueprint(blueprintInput, currentDate)
      return {
        success: true,
        blueprint,
        message: "Using a local starter blueprint because AI generation is unavailable.",
      }
    } catch {
      return {
        success: false,
        error: "Blueprint generation failed. Please try again.",
      }
    }
  }
}
