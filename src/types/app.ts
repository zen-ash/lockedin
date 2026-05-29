import type { Tables, TablesInsert, TablesUpdate } from "@/types/database"

export type Profile              = Tables<"profiles">
export type Goal                 = Tables<"goals">
export type GoalInsert           = TablesInsert<"goals">
export type GoalUpdate           = TablesUpdate<"goals">
export type Group                = Tables<"groups">
export type GroupMember          = Tables<"group_members">
export type WeeklyTask           = Tables<"weekly_tasks">
export type Rating               = Tables<"ratings">
export type MonthlyGoal          = Tables<"monthly_goals">
export type MonthlyGoalInsert    = TablesInsert<"monthly_goals">
export type MonthlyGoalUpdate    = TablesUpdate<"monthly_goals">
export type DailyProgressLog     = Tables<"daily_progress_logs">
export type DailyProgressLogInsert = TablesInsert<"daily_progress_logs">

export type WeeklyGoalRating = Tables<"weekly_goal_ratings">

export type WeeklyGoalRatingWithRater = WeeklyGoalRating & {
  profiles: { username: string | null; full_name: string | null } | null
}

export type SharedProgressLog = {
  id:             string
  log_date:       string
  value_added:    number
  note:           string | null
  is_note_shared: boolean
  created_at:     string
}

export type MonthlyGoalWithGoal = MonthlyGoal & { goals: { title: string } | null }

export type TaskWithGoal = WeeklyTask & { goals: { title: string } | null }

export type TaskWithHierarchy = WeeklyTask & {
  monthly_goals: {
    id:          string
    title:       string
    month_start: string
    goals:       { title: string } | null
  } | null
  goals:  { title: string } | null
  groups: { id: string; name: string } | null
}
