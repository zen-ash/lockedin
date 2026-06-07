export type ImpactLevel = "supporting" | "important" | "critical"

export type BlueprintSource = "ai" | "fallback"

export type BlueprintInput = {
  goalTitle:               string
  deadline:                string
  weeklyAvailabilityHours: number
  goalDescription?:        string
  category?:               string
  currentLevel?:           string
  preferredStartDate?:     string
}

export type BlueprintLongTermGoal = {
  title:       string
  description: string
  deadline:    string
  category?:   string
}

export type BlueprintMonthlyGoal = {
  tempId:        string
  title:         string
  description:   string
  month_start:   string
  target_value?: number
  target_unit?:  string
  impactLevel:   ImpactLevel
  weight:        1 | 2 | 3
  reasoning:     string
}

export type BlueprintWeeklyGoal = {
  tempId:        string
  monthlyTempId: string
  title:         string
  description:   string
  week_start:    string
  target_value?: number
  target_unit?:  string
  reasoning:     string
}

export type BlueprintDraft = {
  longTermGoal: BlueprintLongTermGoal
  monthlyGoals: BlueprintMonthlyGoal[]
  weeklyGoals:  BlueprintWeeklyGoal[]
  summary:      string
  assumptions:  string
  source:       BlueprintSource
  confidence:   "low" | "medium" | "high"
}

export type BlueprintGenerationResult =
  | { success: true;  blueprint: BlueprintDraft; message?: string }
  | { success: false; error: string }
