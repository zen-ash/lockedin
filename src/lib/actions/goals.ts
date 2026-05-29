"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { goalSchema, type GoalFormData } from "@/lib/goals-schema"

export async function createGoal(data: GoalFormData): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = goalSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from("goals").insert({
    user_id:      user.id,
    title:        parsed.data.title.trim(),
    description:  parsed.data.description?.trim() || null,
    category:     parsed.data.category,
    target_date:  parsed.data.target_date?.trim() || null,
    status:       parsed.data.status,
    progress_pct: parsed.data.progress_pct,
  })

  if (error) return { error: error.message }

  revalidatePath("/goals")
  revalidatePath("/dashboard")
  redirect("/goals")
}

export async function updateGoal(
  id: string,
  data: GoalFormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = goalSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from("goals")
    .update({
      title:        parsed.data.title.trim(),
      description:  parsed.data.description?.trim() || null,
      category:     parsed.data.category,
      target_date:  parsed.data.target_date?.trim() || null,
      status:       parsed.data.status,
      progress_pct: parsed.data.progress_pct,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/goals")
  revalidatePath(`/goals/${id}`)
  revalidatePath("/dashboard")
  redirect(`/goals/${id}`)
}

export async function deleteGoal(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23503")
      return {
        error:
          "This goal has linked weekly goals. Remove or reassign them before deleting.",
      }
    return { error: error.message }
  }

  revalidatePath("/goals")
  revalidatePath("/dashboard")
  redirect("/goals")
}
