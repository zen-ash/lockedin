import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import GroupWeeklyGoalCard from "./GroupWeeklyGoalCard"
import {
  getCurrentWeekStartUTC,
  formatDateForSupabase,
  formatWeekRange,
} from "@/lib/utils/week"
import type { WeeklyTask, SharedProgressLog } from "@/types/app"

type ParentGoal = {
  id:           string
  title:        string
  progress_pct: number
}

type ParentMonthlyGoal = {
  id:           string
  title:        string
  month_start:  string
  progress_pct: number
  target_value: number | null
  target_unit:  string | null
  goals:        ParentGoal | null
}

type GroupWeeklyGoalFull = WeeklyTask & {
  monthly_goals: ParentMonthlyGoal | null
  goals:         ParentGoal | null
}

type RatingRow = {
  weekly_task_id: string
  rating:         number
  rater_id:       string
}

interface GroupWeeklyGoalsSectionProps {
  groupId: string
}

export default async function GroupWeeklyGoalsSection({
  groupId,
}: GroupWeeklyGoalsSectionProps) {
  const supabase = await createClient()

  const weekStart    = getCurrentWeekStartUTC()
  const weekStartStr = formatDateForSupabase(weekStart)
  const weekRange    = formatWeekRange(weekStart)

  const { data: rawTasks } = await supabase
    .from("weekly_tasks")
    .select(
      "*, monthly_goals(id, title, month_start, progress_pct, target_value, target_unit, goals(id, title, progress_pct)), goals(id, title, progress_pct)",
    )
    .eq("group_id", groupId)
    .eq("week_start", weekStartStr)
    .order("created_at", { ascending: false })

  const tasks = (rawTasks ?? []) as GroupWeeklyGoalFull[]

  if (tasks.length === 0) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Shared Weekly Goals
          </h2>
          <span className="text-xs text-muted-foreground">{weekRange}</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-sm font-medium text-foreground">No shared weekly goals yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a weekly goal and share it with this group to show progress here.
          </p>
          <Link
            href="/tasks/new"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
          >
            Add a weekly goal
          </Link>
        </div>
      </div>
    )
  }

  const taskIds = tasks.map((t) => t.id)
  const userIds = [...new Set(tasks.map((t) => t.user_id))]

  // Fetch profiles, ratings, and shared logs in parallel
  const [profilesResult, ratingsResult, ...logsResults] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, username, full_name")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("weekly_goal_ratings")
      .select("weekly_task_id, rating, rater_id")
      .in("weekly_task_id", taskIds),
    ...tasks.map((t) =>
      supabase.rpc("get_shared_progress_logs", { p_weekly_task_id: t.id }),
    ),
  ])

  const profileMap: Record<string, { id: string; username: string | null; full_name: string | null }> = {}
  for (const p of profilesResult.data ?? []) {
    profileMap[p.id] = p
  }

  const allRatings = (ratingsResult.data ?? []) as RatingRow[]

  // Compute per-task rating aggregate
  const ratingsByTask: Record<string, { sum: number; count: number }> = {}
  for (const r of allRatings) {
    if (!ratingsByTask[r.weekly_task_id]) {
      ratingsByTask[r.weekly_task_id] = { sum: 0, count: 0 }
    }
    ratingsByTask[r.weekly_task_id].sum   += r.rating
    ratingsByTask[r.weekly_task_id].count += 1
  }

  // Map task index → shared logs
  const logsMap: Record<string, SharedProgressLog[]> = {}
  tasks.forEach((t, i) => {
    logsMap[t.id] = (logsResults[i]?.data ?? []) as SharedProgressLog[]
  })

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Shared Weekly Goals
        </h2>
        <span className="text-xs text-muted-foreground">{weekRange}</span>
      </div>

      <div className="flex flex-col gap-4">
        {tasks.map((task) => {
          const agg = ratingsByTask[task.id]
          return (
            <GroupWeeklyGoalCard
              key={task.id}
              task={task}
              profile={profileMap[task.user_id] ?? null}
              sharedLogs={logsMap[task.id] ?? []}
              avgRating={agg ? agg.sum / agg.count : 0}
              ratingCount={agg?.count ?? 0}
            />
          )
        })}
      </div>
    </div>
  )
}
