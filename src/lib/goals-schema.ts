import { z } from "zod"

export const GOAL_CATEGORIES = [
  "career",
  "fitness",
  "finance",
  "education",
  "project",
  "personal",
  "other",
] as const

export const GOAL_STATUSES = [
  "active",
  "completed",
  "paused",
  "abandoned",
] as const

export const CATEGORY_LABELS: Record<string, string> = {
  career:    "Career",
  fitness:   "Fitness",
  finance:   "Finance",
  education: "Education",
  project:   "Project",
  personal:  "Personal",
  other:     "Other",
}

export const STATUS_LABELS: Record<string, string> = {
  active:    "Active",
  completed: "Completed",
  paused:    "Paused",
  abandoned: "Abandoned",
}

export const goalSchema = z.object({
  title:        z.string().min(1, "Title is required").max(200, "Title is too long"),
  description:  z.string().max(2000, "Description is too long").optional(),
  category:     z.enum(GOAL_CATEGORIES),
  target_date:  z.string().optional(),
  status:       z.enum(GOAL_STATUSES),
  progress_pct: z.number().int().min(0, "Progress must be 0–100").max(100, "Progress must be 0–100"),
})

export type GoalFormData = z.infer<typeof goalSchema>
export type GoalCategory = (typeof GOAL_CATEGORIES)[number]
export type GoalStatus   = (typeof GOAL_STATUSES)[number]
