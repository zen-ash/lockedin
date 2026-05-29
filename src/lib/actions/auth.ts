"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function signup(data: {
  email: string
  password: string
  fullName: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.fullName },
    },
  })

  if (error) return { error: error.message }

  redirect("/onboarding")
}

export async function login(data: {
  email: string
  password: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) return { error: error.message }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export async function completeOnboarding(data: {
  username: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { error: "Not authenticated." }

  const username = data.username.toLowerCase().trim()

  // Check username availability (pre-flight UX check; DB unique constraint is the true guard)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  if (existing) return { error: "Username is already taken. Try another one." }

  // Persist to profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (profileError) {
    if (profileError.code === "23505")
      return { error: "Username is already taken. Try another one." }
    return { error: "Failed to save username. Please try again." }
  }

  // Mirror username into user_metadata so middleware can check it without a DB round-trip
  await supabase.auth.updateUser({ data: { username } })

  revalidatePath("/", "layout")
  redirect("/dashboard")
}
