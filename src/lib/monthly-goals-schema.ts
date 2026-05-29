import { z } from "zod"

export const MONTHLY_GOAL_STATUSES   = ["active", "completed", "paused", "abandoned"] as const
export const MONTHLY_GOAL_CATEGORIES = [
  "career", "fitness", "finance", "education", "project", "personal", "other",
] as const

export const MONTHLY_GOAL_STATUS_LABELS: Record<string, string> = {
  active:    "Active",
  completed: "Completed",
  paused:    "Paused",
  abandoned: "Abandoned",
}

export const MONTHLY_GOAL_CATEGORY_LABELS: Record<string, string> = {
  career:    "Career",
  fitness:   "Fitness",
  finance:   "Finance",
  education: "Education",
  project:   "Project",
  personal:  "Personal",
  other:     "Other",
}

export const monthlyGoalFormSchema = z.object({
  title:        z.string().min(1, "Title is required").max(200, "Title is too long"),
  description:  z.string().max(2000, "Description is too long").optional(),
  // Input type="month" returns "YYYY-MM"; server action normalizes to "YYYY-MM-01"
  month_start:  z.string().min(1, "Month is required"),
  category:     z.enum(MONTHLY_GOAL_CATEGORIES).optional(),
  status:       z.enum(MONTHLY_GOAL_STATUSES),
  // weight is numeric (not int) in the DB — decimal weights are supported
  weight:       z.number().positive("Weight must be greater than 0"),
  // blank → undefined (omitted from form) → action sends null to DB
  target_value: z.number().positive("Target value must be greater than 0").optional(),
  target_unit:  z.string().optional(),
})

export type MonthlyGoalFormData   = z.infer<typeof monthlyGoalFormSchema>
export type MonthlyGoalStatus     = (typeof MONTHLY_GOAL_STATUSES)[number]
export type MonthlyGoalCategory   = (typeof MONTHLY_GOAL_CATEGORIES)[number]
