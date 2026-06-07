"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createProgressLogSchema, updateProgressLogSchema } from "@/lib/progress-logs-schema"
import type { CreateProgressLogData, UpdateProgressLogData } from "@/lib/progress-logs-schema"

// Resolves the parent goal id for a task.
// For tasks with goal_id set directly (manual tasks), returns it immediately.
// For blueprint tasks (goal_id null, monthly_goal_id set), follows the monthly goal FK.
async function resolveGoalId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  task: { goal_id: string | null; monthly_goal_id: string | null },
  userId: string,
): Promise<string | null> {
  if (task.goal_id) return task.goal_id
  if (!task.monthly_goal_id) return null
  const { data: mg } = await supabase
    .from("monthly_goals")
    .select("goal_id")
    .eq("id", task.monthly_goal_id)
    .eq("user_id", userId)
    .single()
  return mg?.goal_id ?? null
}

export async function createProgressLog(
  data: CreateProgressLogData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = createProgressLogSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: task } = await supabase
    .from("weekly_tasks")
    .select("id, monthly_goal_id, goal_id")
    .eq("id", parsed.data.weekly_task_id)
    .eq("user_id", user.id)
    .single()
  if (!task) return { error: "Weekly goal not found." }

  const { error } = await supabase.from("daily_progress_logs").insert({
    user_id:        user.id,
    weekly_task_id: parsed.data.weekly_task_id,
    log_date:       parsed.data.log_date,
    value_added:    parsed.data.value_added,
    note:           parsed.data.note?.trim() || null,
    is_note_shared: parsed.data.is_note_shared ?? false,
  })

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${parsed.data.weekly_task_id}`)
  if (task.monthly_goal_id) revalidatePath(`/monthly-goals/${task.monthly_goal_id}`)

  const goalId = await resolveGoalId(supabase, task, user.id)
  if (goalId) revalidatePath(`/goals/${goalId}`)

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return {}
}

export async function updateProgressLog(
  logId: string,
  data: UpdateProgressLogData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = updateProgressLogSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: log } = await supabase
    .from("daily_progress_logs")
    .select("id, weekly_task_id")
    .eq("id", logId)
    .eq("user_id", user.id)
    .single()
  if (!log) return { error: "Progress log not found." }

  const { data: task } = await supabase
    .from("weekly_tasks")
    .select("id, monthly_goal_id, goal_id")
    .eq("id", log.weekly_task_id)
    .single()

  const { error } = await supabase
    .from("daily_progress_logs")
    .update({
      log_date:       parsed.data.log_date,
      value_added:    parsed.data.value_added,
      note:           parsed.data.note?.trim() || null,
      is_note_shared: parsed.data.is_note_shared ?? false,
    })
    .eq("id", logId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${log.weekly_task_id}`)
  if (task?.monthly_goal_id) revalidatePath(`/monthly-goals/${task.monthly_goal_id}`)

  if (task) {
    const goalId = await resolveGoalId(supabase, task, user.id)
    if (goalId) revalidatePath(`/goals/${goalId}`)
  }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return {}
}

export async function deleteProgressLog(logId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { data: log } = await supabase
    .from("daily_progress_logs")
    .select("id, weekly_task_id")
    .eq("id", logId)
    .eq("user_id", user.id)
    .single()
  if (!log) return { error: "Progress log not found." }

  const { data: task } = await supabase
    .from("weekly_tasks")
    .select("id, monthly_goal_id, goal_id")
    .eq("id", log.weekly_task_id)
    .single()

  const { error } = await supabase
    .from("daily_progress_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${log.weekly_task_id}`)
  if (task?.monthly_goal_id) revalidatePath(`/monthly-goals/${task.monthly_goal_id}`)

  if (task) {
    const goalId = await resolveGoalId(supabase, task, user.id)
    if (goalId) revalidatePath(`/goals/${goalId}`)
  }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return {}
}
