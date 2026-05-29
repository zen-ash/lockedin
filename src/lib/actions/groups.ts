"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  createGroupSchema,
  joinGroupSchema,
  updateGroupSchema,
} from "@/lib/groups-schema"
import type { CreateGroupData, JoinGroupData, UpdateGroupData } from "@/lib/groups-schema"

type CreateGroupRpcResult = {
  group_id:    string
  invite_code: string
}

export async function createGroup(
  data: CreateGroupData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = createGroupSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: rpcData, error } = await supabase.rpc("create_group_with_owner", {
    p_name:        parsed.data.name.trim(),
    p_description: parsed.data.description?.trim() || undefined,
  })

  if (error) return { error: error.message }

  const result = rpcData as CreateGroupRpcResult | null
  if (!result?.group_id) {
    return { error: "Group was created but no group ID was returned." }
  }

  revalidatePath("/groups")
  revalidatePath("/dashboard")
  redirect(`/groups/${result.group_id}`)
}

export async function joinGroup(
  data: JoinGroupData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = joinGroupSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const inviteCode = parsed.data.invite_code.trim().toUpperCase()

  const { data: groupId, error } = await supabase.rpc("join_group_by_invite", {
    p_invite_code: inviteCode,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes("already") || error.code === "23505") {
      return { error: "You are already a member of this group." }
    }
    return { error: "Invalid invite code. Please check and try again." }
  }

  if (!groupId) {
    return { error: "Invalid invite code. Please check and try again." }
  }

  revalidatePath("/groups")
  revalidatePath("/dashboard")
  redirect(`/groups/${groupId}`)
}

export async function updateGroup(
  groupId: string,
  data: UpdateGroupData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = updateGroupSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single()

  if (!membership || membership.role !== "owner") {
    return { error: "You do not have permission to edit this group." }
  }

  const { error } = await supabase
    .from("groups")
    .update({
      name:        parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
    })
    .eq("id", groupId)

  if (error) return { error: "Failed to save changes. Please try again." }

  revalidatePath(`/groups/${groupId}`)
  revalidatePath("/groups")
  revalidatePath("/dashboard")
  redirect(`/groups/${groupId}`)
}

export async function leaveGroup(
  groupId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id)

  if (error) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes("last owner") ||
      msg.includes("owner") ||
      error.code === "P0001"
    ) {
      return {
        error: "You must transfer ownership before leaving this group.",
      }
    }
    return { error: error.message }
  }

  revalidatePath("/groups")
  revalidatePath("/dashboard")
  redirect("/groups")
}

export async function removeMember(
  groupId: string,
  memberUserId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  if (memberUserId === user.id) {
    return { error: "You cannot remove yourself. Use 'Leave group' instead." }
  }

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single()

  if (!myMembership || myMembership.role !== "owner") {
    return { error: "You do not have permission to remove members." }
  }

  const { data: targetMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", memberUserId)
    .single()

  if (!targetMembership) {
    return { error: "This user is not a member of the group." }
  }

  if (targetMembership.role === "owner") {
    return {
      error: "Cannot remove another owner. Ownership transfer is not available yet.",
    }
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberUserId)

  if (error) return { error: "Failed to remove member. Please try again." }

  revalidatePath(`/groups/${groupId}`)
  return {}
}
