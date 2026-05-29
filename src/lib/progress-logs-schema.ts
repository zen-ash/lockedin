import { z } from "zod"

export const createProgressLogSchema = z.object({
  weekly_task_id: z.string().min(1, "Weekly goal is required"),
  log_date:       z.string().min(1, "Date is required"),
  value_added:    z.number().min(0, "Value must be 0 or greater"),
  note:           z.string().max(1000, "Note is too long").optional(),
  is_note_shared: z.boolean().optional(),
})

export const updateProgressLogSchema = z.object({
  log_date:       z.string().min(1, "Date is required"),
  value_added:    z.number().min(0, "Value must be 0 or greater"),
  note:           z.string().max(1000, "Note is too long").optional(),
  is_note_shared: z.boolean().optional(),
})

export type CreateProgressLogData = z.infer<typeof createProgressLogSchema>
export type UpdateProgressLogData = z.infer<typeof updateProgressLogSchema>
