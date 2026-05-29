"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { weeklyGoalRatingSchema } from "@/lib/ratings-schema"
import type { WeeklyGoalRatingData } from "@/lib/ratings-schema"

export async function upsertWeeklyGoalRating(
  data: WeeklyGoalRatingData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = weeklyGoalRatingSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Verify weekly goal exists, is group-shared, and caller is a member but not the owner
  const { data: task } = await supabase
    .from("weekly_tasks")
    .select("id, user_id, group_id")
    .eq("id", parsed.data.weekly_task_id)
    .single()

  if (!task) return { error: "Weekly goal not found." }
  if (!task.group_id) return { error: "Cannot rate a private weekly goal." }
  if (task.user_id === user.id) return { error: "You cannot rate your own weekly goal." }

  // Verify group membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", task.group_id)
    .eq("user_id", user.id)
    .single()

  if (!membership) return { error: "You must be a member of the group to rate this goal." }

  const { error } = await supabase
    .from("weekly_goal_ratings")
    .upsert(
      {
        weekly_task_id: parsed.data.weekly_task_id,
        rater_id:       user.id,
        rating:         parsed.data.rating,
        comment:        parsed.data.comment?.trim() || null,
      },
      { onConflict: "weekly_task_id,rater_id" },
    )

  if (error) return { error: "Failed to save your review. Please try again." }

  revalidatePath(`/tasks/${parsed.data.weekly_task_id}`)
  revalidatePath(`/groups/${task.group_id}`)
  return {}
}

export async function deleteWeeklyGoalRating(
  ratingId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  // Fetch rating to get task context for revalidation
  const { data: rating } = await supabase
    .from("weekly_goal_ratings")
    .select("id, weekly_task_id, rater_id")
    .eq("id", ratingId)
    .eq("rater_id", user.id)
    .single()

  if (!rating) return { error: "Rating not found." }

  const { data: task } = await supabase
    .from("weekly_tasks")
    .select("id, group_id")
    .eq("id", rating.weekly_task_id)
    .single()

  const { error } = await supabase
    .from("weekly_goal_ratings")
    .delete()
    .eq("id", ratingId)
    .eq("rater_id", user.id)

  if (error) return { error: "Failed to remove your review. Please try again." }

  revalidatePath(`/tasks/${rating.weekly_task_id}`)
  if (task?.group_id) revalidatePath(`/groups/${task.group_id}`)
  return {}
}
