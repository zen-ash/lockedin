"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentWeekStartUTC,
  formatDateForSupabase,
  isWeekLocked,
} from "@/lib/utils/week"
import { taskFormSchema, taskProgressSchema } from "@/lib/tasks-schema"
import type { TaskFormData, TaskProgressData } from "@/lib/tasks-schema"

export async function createTask(data: TaskFormData): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = taskFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const weekStart = getCurrentWeekStartUTC()
  if (isWeekLocked(weekStart)) {
    return { error: "This week is locked. Weekly goals can only be created before Monday 23:59 UTC." }
  }

  const weekStartStr = formatDateForSupabase(weekStart)

  // Validate monthly_goal_id if provided (DB trigger also enforces this)
  if (parsed.data.monthly_goal_id) {
    const { data: mg } = await supabase
      .from("monthly_goals")
      .select("id")
      .eq("id", parsed.data.monthly_goal_id)
      .eq("user_id", user.id)
      .single()
    if (!mg) return { error: "Invalid monthly goal selected." }
  } else if (parsed.data.goal_id) {
    const { data: goal } = await supabase
      .from("goals")
      .select("id")
      .eq("id", parsed.data.goal_id)
      .eq("user_id", user.id)
      .single()
    if (!goal) return { error: "Invalid goal selected." }
  }

  // Validate group membership server-side (DB trigger also enforces this)
  const groupId = parsed.data.group_id || null
  if (groupId) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single()
    if (!membership) return { error: "You are not a member of the selected group." }
  }

  const { error } = await supabase.from("weekly_tasks").insert({
    user_id:         user.id,
    group_id:        groupId,
    week_start:      weekStartStr,
    title:           parsed.data.title.trim(),
    description:     parsed.data.description?.trim() || null,
    monthly_goal_id: parsed.data.monthly_goal_id || null,
    goal_id:         parsed.data.monthly_goal_id ? null : (parsed.data.goal_id || null),
    category:        parsed.data.category || null,
    priority:        parsed.data.priority,
    target_value:    parsed.data.target_value ?? null,
    target_unit:     parsed.data.target_unit?.trim() || null,
    due_date:        parsed.data.due_date || null,
  })

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  if (groupId) revalidatePath(`/groups/${groupId}`)
  redirect("/tasks")
}

export async function updateTask(
  taskId: string,
  data: TaskFormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = taskFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: task } = await supabase
    .from("weekly_tasks")
    .select("id, week_start, group_id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single()
  if (!task) return { error: "Weekly goal not found." }

  const weekStart = new Date(task.week_start + "T00:00:00Z")
  if (isWeekLocked(weekStart)) {
    return { error: "This week is locked. Structural edits are not allowed after Monday 23:59 UTC." }
  }

  if (parsed.data.monthly_goal_id) {
    const { data: mg } = await supabase
      .from("monthly_goals")
      .select("id")
      .eq("id", parsed.data.monthly_goal_id)
      .eq("user_id", user.id)
      .single()
    if (!mg) return { error: "Invalid monthly goal selected." }
  } else if (parsed.data.goal_id) {
    const { data: goal } = await supabase
      .from("goals")
      .select("id")
      .eq("id", parsed.data.goal_id)
      .eq("user_id", user.id)
      .single()
    if (!goal) return { error: "Invalid goal selected." }
  }

  const newGroupId = parsed.data.group_id || null
  if (newGroupId) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", newGroupId)
      .eq("user_id", user.id)
      .single()
    if (!membership) return { error: "You are not a member of the selected group." }
  }

  const { error } = await supabase
    .from("weekly_tasks")
    .update({
      title:           parsed.data.title.trim(),
      description:     parsed.data.description?.trim() || null,
      monthly_goal_id: parsed.data.monthly_goal_id || null,
      goal_id:         parsed.data.monthly_goal_id ? null : (parsed.data.goal_id || null),
      group_id:        newGroupId,
      category:        parsed.data.category || null,
      priority:        parsed.data.priority,
      target_value:    parsed.data.target_value ?? null,
      target_unit:     parsed.data.target_unit?.trim() || null,
      due_date:        parsed.data.due_date || null,
    })
    .eq("id", taskId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  revalidatePath(`/tasks/${taskId}`)
  // Revalidate old and new group pages if group changed
  const oldGroupId = task.group_id
  if (oldGroupId) revalidatePath(`/groups/${oldGroupId}`)
  if (newGroupId && newGroupId !== oldGroupId) revalidatePath(`/groups/${newGroupId}`)
  redirect(`/tasks/${taskId}`)
}

export async function updateTaskProgress(
  taskId: string,
  data: TaskProgressData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = taskProgressSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: task } = await supabase
    .from("weekly_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single()
  if (!task) return { error: "Weekly goal not found." }

  const { error } = await supabase
    .from("weekly_tasks")
    .update({
      status:     parsed.data.status,
      reflection: parsed.data.reflection?.trim() || null,
    })
    .eq("id", taskId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath("/dashboard")
  return {}
}

export async function deleteTask(taskId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { data: task } = await supabase
    .from("weekly_tasks")
    .select("id, week_start, group_id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single()
  if (!task) return { error: "Weekly goal not found." }

  const weekStart = new Date(task.week_start + "T00:00:00Z")
  if (isWeekLocked(weekStart)) {
    return { error: "This week is locked. This weekly goal cannot be deleted." }
  }

  const groupId = task.group_id

  const { error } = await supabase
    .from("weekly_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  if (groupId) revalidatePath(`/groups/${groupId}`)
  redirect("/tasks")
}
