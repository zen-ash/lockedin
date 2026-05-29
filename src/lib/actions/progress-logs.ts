"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createProgressLogSchema, updateProgressLogSchema } from "@/lib/progress-logs-schema"
import type { CreateProgressLogData, UpdateProgressLogData } from "@/lib/progress-logs-schema"

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
  if (task.goal_id) revalidatePath(`/goals/${task.goal_id}`)
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
  if (task?.goal_id) revalidatePath(`/goals/${task.goal_id}`)
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
  if (task?.goal_id) revalidatePath(`/goals/${task.goal_id}`)
  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return {}
}
