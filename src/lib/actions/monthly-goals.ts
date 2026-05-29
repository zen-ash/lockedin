"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { monthlyGoalFormSchema } from "@/lib/monthly-goals-schema"
import type { MonthlyGoalFormData } from "@/lib/monthly-goals-schema"

// Input type="month" returns "YYYY-MM"; Postgres date column requires "YYYY-MM-DD"
function normalizeMonthStart(monthStr: string): string {
  return monthStr.length === 7 ? `${monthStr}-01` : monthStr
}

export async function createMonthlyGoal(
  goalId: string,
  data: MonthlyGoalFormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = monthlyGoalFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: goal } = await supabase
    .from("goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single()
  if (!goal) return { error: "Goal not found." }

  const { error } = await supabase.from("monthly_goals").insert({
    user_id:      user.id,
    goal_id:      goalId,
    month_start:  normalizeMonthStart(parsed.data.month_start),
    title:        parsed.data.title.trim(),
    description:  parsed.data.description?.trim() || null,
    category:     parsed.data.category || null,
    status:       parsed.data.status,
    weight:       parsed.data.weight,
    target_value: parsed.data.target_value ?? null,
    target_unit:  parsed.data.target_unit?.trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/goals/${goalId}`)
  redirect(`/goals/${goalId}`)
}

export async function updateMonthlyGoal(
  id: string,
  data: MonthlyGoalFormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = monthlyGoalFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: mg } = await supabase
    .from("monthly_goals")
    .select("id, goal_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
  if (!mg) return { error: "Monthly goal not found." }

  const { error } = await supabase
    .from("monthly_goals")
    .update({
      month_start:  normalizeMonthStart(parsed.data.month_start),
      title:        parsed.data.title.trim(),
      description:  parsed.data.description?.trim() || null,
      category:     parsed.data.category || null,
      status:       parsed.data.status,
      weight:       parsed.data.weight,
      target_value: parsed.data.target_value ?? null,
      target_unit:  parsed.data.target_unit?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/goals/${mg.goal_id}`)
  revalidatePath(`/monthly-goals/${id}`)
  redirect(`/monthly-goals/${id}`)
}

export async function deleteMonthlyGoal(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { data: mg } = await supabase
    .from("monthly_goals")
    .select("id, goal_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
  if (!mg) return { error: "Monthly goal not found." }

  const { error } = await supabase
    .from("monthly_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/goals/${mg.goal_id}`)
  redirect(`/goals/${mg.goal_id}`)
}
