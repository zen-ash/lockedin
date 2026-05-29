import { z } from "zod"

export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
})

export const joinGroupSchema = z.object({
  invite_code: z
    .string()
    .min(1, "Invite code is required")
    .max(20, "Invite code is too long"),
})

export const updateGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
})

export type CreateGroupData = z.infer<typeof createGroupSchema>
export type JoinGroupData   = z.infer<typeof joinGroupSchema>
export type UpdateGroupData = z.infer<typeof updateGroupSchema>
