import { z } from "zod"

export const weeklyGoalRatingSchema = z.object({
  weekly_task_id: z.string().min(1, "Weekly goal is required"),
  rating:         z.number().int().min(1, "Rating must be 1–5").max(5, "Rating must be 1–5"),
  comment:        z.string().max(500, "Comment is too long").optional(),
})

export type WeeklyGoalRatingData = z.infer<typeof weeklyGoalRatingSchema>
