import { z } from "zod"

export const TASK_CATEGORIES = [
  "career",
  "fitness",
  "finance",
  "education",
  "project",
  "personal",
  "other",
] as const

export const TASK_PRIORITIES = ["high", "medium", "low"] as const
export const TASK_STATUSES = ["pending", "in_progress", "completed", "missed"] as const

export const CATEGORY_LABELS: Record<string, string> = {
  career:    "Career",
  fitness:   "Fitness",
  finance:   "Finance",
  education: "Education",
  project:   "Project",
  personal:  "Personal",
  other:     "Other",
}

export const PRIORITY_LABELS: Record<string, string> = {
  high:   "High",
  medium: "Medium",
  low:    "Low",
}

export const STATUS_LABELS: Record<string, string> = {
  pending:     "Pending",
  in_progress: "In Progress",
  completed:   "Completed",
  missed:      "Missed",
}

export const taskFormSchema = z.object({
  title:           z.string().min(1, "Title is required").max(200, "Title is too long"),
  description:     z.string().max(2000, "Description is too long").optional(),
  monthly_goal_id: z.string().optional(),
  goal_id:         z.string().optional(),
  group_id:        z.string().optional(),
  category:        z.enum(TASK_CATEGORIES).optional(),
  priority:        z.enum(TASK_PRIORITIES),
  target_value:    z.number().positive("Must be greater than 0").optional(),
  target_unit:     z.string().max(50, "Unit is too long").optional(),
  due_date:        z.string().optional(),
})

export const taskProgressSchema = z.object({
  status:     z.enum(TASK_STATUSES),
  reflection: z.string().max(2000, "Reflection is too long").optional(),
})

export type TaskFormData     = z.infer<typeof taskFormSchema>
export type TaskProgressData = z.infer<typeof taskProgressSchema>
export type TaskCategory     = (typeof TASK_CATEGORIES)[number]
export type TaskPriority     = (typeof TASK_PRIORITIES)[number]
export type TaskStatus       = (typeof TASK_STATUSES)[number]

// used by task pages to pass pre-computed options to TaskForm
export type MonthlyGoalOption = { id: string; label: string }
export type GoalOption        = { id: string; title: string }
export type GroupOption       = { id: string; name: string }
