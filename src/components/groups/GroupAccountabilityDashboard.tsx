import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import WeekNavigator from "./WeekNavigator"
import GroupDashboardSummaryCards from "./GroupDashboardSummaryCards"
import NeedsReviewSection from "./NeedsReviewSection"
import MemberAccountabilityCard from "./MemberAccountabilityCard"
import type { NeedsReviewTask } from "./NeedsReviewSection"
import type {
  DashboardTask,
  DashboardTaskData,
  DashboardMember,
  MemberStatus,
} from "./MemberAccountabilityCard"
import type { SharedProgressLog } from "@/types/app"

// ── Local types ───────────────────────────────────────────────────────────────

type TaskRatingRow = {
  id:             string
  weekly_task_id: string
  rater_id:       string
  rating:         number
  comment:        string | null
  created_at:     string
  profiles:       { username: string | null; full_name: string | null } | null
}

interface GroupAccountabilityDashboardProps {
  groupId:       string
  currentUserId: string
  members:       DashboardMember[]
  weekStartStr:  string
  weekRange:     string
  isCurrentWeek: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default async function GroupAccountabilityDashboard({
  groupId,
  currentUserId,
  members,
  weekStartStr,
  weekRange,
  isCurrentWeek,
}: GroupAccountabilityDashboardProps) {
  const supabase = await createClient()

  // Fetch shared weekly tasks for this group + week with full parent hierarchy
  const { data: rawTasks } = await supabase
    .from("weekly_tasks")
    .select(
      "id, user_id, title, description, status, progress, current_value, target_value, target_unit, week_start, monthly_goals(id, title, month_start, progress_pct, target_value, target_unit, goals(id, title, progress_pct)), goals(id, title, progress_pct)",
    )
    .eq("group_id", groupId)
    .eq("week_start", weekStartStr)
    .order("created_at", { ascending: true })

  const tasks = (rawTasks ?? []) as unknown as DashboardTask[]
  const taskIds = tasks.map((t) => t.id)

  // Parallel fetch: ratings (with rater profiles) + shared logs per task
  let allRatings: TaskRatingRow[] = []
  const logsMap: Record<string, SharedProgressLog[]> = {}

  if (taskIds.length > 0) {
    const [ratingsResult, ...logsResults] = await Promise.all([
      supabase
        .from("weekly_goal_ratings")
        .select(
          "id, weekly_task_id, rater_id, rating, comment, created_at, profiles(username, full_name)",
        )
        .in("weekly_task_id", taskIds),
      ...tasks.map((t) =>
        supabase.rpc("get_shared_progress_logs", { p_weekly_task_id: t.id }),
      ),
    ])

    allRatings = (ratingsResult.data ?? []) as unknown as TaskRatingRow[]

    tasks.forEach((t, i) => {
      logsMap[t.id] = (logsResults[i]?.data ?? []) as SharedProgressLog[]
    })
  }

  // ── Aggregate ratings by task ─────────────────────────────────────────────

  const ratingsByTask: Record<string, TaskRatingRow[]> = {}
  for (const r of allRatings) {
    if (!ratingsByTask[r.weekly_task_id]) ratingsByTask[r.weekly_task_id] = []
    ratingsByTask[r.weekly_task_id].push(r)
  }

  // ── Summary metrics ───────────────────────────────────────────────────────

  const sharedGoalCount = tasks.length

  const groupCompletionPct =
    tasks.length === 0
      ? 0
      : Math.round(
          tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length,
        )

  const ratingsExpected = tasks.length * Math.max(0, members.length - 1)
  const ratingsGiven    = allRatings.length

  // Active: member shared a goal OR logged any progress on a shared goal
  const activeUserIds = new Set<string>()
  for (const t of tasks) {
    activeUserIds.add(t.user_id)
  }
  const activeMembers = members.filter((m) => activeUserIds.has(m.user_id)).length

  // ── Needs-review list ─────────────────────────────────────────────────────

  const myRatedTaskIds = new Set(
    allRatings
      .filter((r) => r.rater_id === currentUserId)
      .map((r) => r.weekly_task_id),
  )

  const needsReviewTasks: NeedsReviewTask[] = tasks
    .filter((t) => t.user_id !== currentUserId && !myRatedTaskIds.has(t.id))
    .map((t) => {
      const owner       = members.find((m) => m.user_id === t.user_id)
      const ownerHandle = owner?.profile?.username
        ? `@${owner.profile.username}`
        : (owner?.profile?.full_name ?? "Unknown")
      return {
        id:            t.id,
        title:         t.title,
        progress:      t.progress,
        current_value: t.current_value,
        target_value:  t.target_value,
        target_unit:   t.target_unit,
        ownerHandle,
      }
    })

  // ── Per-member data ───────────────────────────────────────────────────────

  type MemberData = {
    member:          DashboardMember
    tasks:           DashboardTaskData[]
    sharedGoalCount: number
    avgProgress:     number
    lastLogDate:     string | null
    status:          MemberStatus
  }

  const memberDataList: MemberData[] = members.map((member) => {
    const memberTasks = tasks.filter((t) => t.user_id === member.user_id)

    const taskDataList: DashboardTaskData[] = memberTasks.map((task) => {
      const taskRatings  = ratingsByTask[task.id] ?? []
      const ratingCount  = taskRatings.length
      const avgRating    =
        ratingCount > 0
          ? taskRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
          : 0
      const myRating = taskRatings.find((r) => r.rater_id === currentUserId)
      return {
        task,
        sharedLogs:        logsMap[task.id] ?? [],
        avgRating,
        ratingCount,
        currentUserRating: myRating
          ? { id: myRating.id, rating: myRating.rating, comment: myRating.comment }
          : null,
      }
    })

    const goalCount    = memberTasks.length
    const avgProgress  =
      goalCount > 0
        ? memberTasks.reduce((sum, t) => sum + t.progress, 0) / goalCount
        : 0

    // Last log date across all member's tasks
    const allLogs = memberTasks.flatMap((t) => logsMap[t.id] ?? [])
    const sortedLogs = [...allLogs].sort((a, b) =>
      b.log_date.localeCompare(a.log_date),
    )
    const lastLogDate = sortedLogs[0]?.log_date ?? null

    const status: MemberStatus =
      goalCount === 0
        ? "no_shared_goals"
        : avgProgress >= 70
          ? "on_track"
          : "needs_attention"

    return {
      member,
      tasks:           taskDataList,
      sharedGoalCount: goalCount,
      avgProgress,
      lastLogDate,
      status,
    }
  })

  // ── Empty state ───────────────────────────────────────────────────────────

  const isEmpty = tasks.length === 0

  return (
    <div className="flex flex-col gap-6">
      {/* Section header + week navigator */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Weekly Accountability
          </h2>
          <Link
            href={`/groups/${groupId}/recap?week=${weekStartStr}`}
            className="text-xs text-primary transition-colors hover:text-primary/80"
          >
            View Recap →
          </Link>
        </div>
        <WeekNavigator
          groupId={groupId}
          weekStartStr={weekStartStr}
          weekRange={weekRange}
          isCurrentWeek={isCurrentWeek}
        />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            No shared weekly goals this week.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a weekly goal and share it with this group to track progress together.
          </p>
          <Link
            href="/tasks/new"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
          >
            Create a Weekly Goal
          </Link>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <GroupDashboardSummaryCards
            sharedGoalCount={sharedGoalCount}
            groupCompletionPct={groupCompletionPct}
            ratingsGiven={ratingsGiven}
            ratingsExpected={ratingsExpected}
            activeMembers={activeMembers}
            totalMembers={members.length}
          />

          {/* Needs review */}
          <NeedsReviewSection tasks={needsReviewTasks} />

          {/* Member progress */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Member Progress
            </h2>
            <div className="flex flex-col gap-4">
              {memberDataList.map((md) => (
                <MemberAccountabilityCard
                  key={md.member.user_id}
                  member={md.member}
                  tasks={md.tasks}
                  currentUserId={currentUserId}
                  sharedGoalCount={md.sharedGoalCount}
                  avgProgress={md.avgProgress}
                  lastLogDate={md.lastLogDate}
                  status={md.status}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
