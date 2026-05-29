import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentWeekStartUTC,
  formatDateForSupabase,
  formatWeekRange,
} from "@/lib/utils/week"
import WeeklyRecapHeader from "@/components/groups/WeeklyRecapHeader"
import WeeklyRecapSummaryCards from "@/components/groups/WeeklyRecapSummaryCards"
import WeeklyRecapMemberCard from "@/components/groups/WeeklyRecapMemberCard"
import WeeklyRecapMissingReviews from "@/components/groups/WeeklyRecapMissingReviews"
import CopyRecapButton from "@/components/groups/CopyRecapButton"
import type { RecapTaskData, RecapTask } from "@/components/groups/WeeklyRecapGoalCard"
import type { RecapMember, RecapMemberStatus } from "@/components/groups/WeeklyRecapMemberCard"
import type { RecapMissingReview } from "@/components/groups/WeeklyRecapMissingReviews"
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRecapText(
  groupName:          string,
  weekRange:          string,
  sharedGoalCount:    number,
  groupCompletionPct: number,
  loggedMembersCount: number,
  ratingsGiven:       number,
  ratingsExpected:    number,
  memberRows: Array<{
    member:          RecapMember
    tasks:           RecapTaskData[]
    sharedGoalCount: number
    avgProgress:     number
  }>,
): string {
  if (sharedGoalCount === 0) {
    return `${groupName} — ${weekRange}\n\nNo shared weekly goals were posted for this week.`
  }

  const lines: string[] = [
    `${groupName} — Weekly Recap`,
    weekRange,
    "",
    `This week, the group shared ${sharedGoalCount} weekly ${sharedGoalCount === 1 ? "goal" : "goals"} with an average completion of ${groupCompletionPct}%.`,
  ]

  if (loggedMembersCount > 0) {
    lines.push(
      `${loggedMembersCount} ${loggedMembersCount === 1 ? "member" : "members"} logged progress.`,
    )
  }

  if (ratingsExpected > 0) {
    lines.push(
      `${ratingsGiven} of ${ratingsExpected} peer ${ratingsExpected === 1 ? "review was" : "reviews were"} submitted.`,
    )
  }

  const activeRows = memberRows.filter((r) => r.sharedGoalCount > 0)
  if (activeRows.length > 0) {
    lines.push("", "Member Progress:")
    for (const row of activeRows) {
      const handle =
        row.member.profile?.username
          ? `@${row.member.profile.username}`
          : (row.member.profile?.full_name ?? "Unknown")
      lines.push(
        `${handle}: ${row.sharedGoalCount} ${row.sharedGoalCount === 1 ? "goal" : "goals"}, ${Math.round(row.avgProgress)}% avg`,
      )
      for (const { task } of row.tasks) {
        lines.push(`  • ${task.title} — ${Math.round(task.progress)}%`)
      }
    }
  }

  return lines.join("\n")
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RecapPage({
  params,
  searchParams,
}: {
  params:        Promise<{ id: string }>
  searchParams?: Promise<{ week?: string }>
}) {
  const { id }       = await params
  const resolved     = searchParams ? await searchParams : {}
  const weekParam    = resolved.week ?? ""

  // Resolve selected week — must be a Monday (getUTCDay() === 1)
  const currentWeekStart = getCurrentWeekStartUTC()
  const currentWeekStr   = formatDateForSupabase(currentWeekStart)

  let weekStartStr = currentWeekStr
  if (/^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    const candidate = new Date(weekParam + "T00:00:00Z")
    if (!isNaN(candidate.getTime()) && candidate.getUTCDay() === 1) {
      weekStartStr = weekParam
    }
  }

  const weekRange     = formatWeekRange(new Date(weekStartStr + "T00:00:00Z"))
  const isCurrentWeek = weekStartStr === currentWeekStr

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Fetch group + membership + member list in parallel
  const [{ data: group }, { data: myMembership }, { data: memberRows }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", id).single(),
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("group_members")
      .select("*")
      .eq("group_id", id)
      .order("joined_at", { ascending: true }),
  ])

  if (!group || !myMembership) notFound()

  // Fetch member profiles
  const userIds = (memberRows ?? []).map((m) => m.user_id)
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", userIds)
      : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const members: RecapMember[] = (memberRows ?? []).map((m) => ({
    user_id: m.user_id,
    role:    m.role,
    profile: profileMap[m.user_id] ?? null,
  }))

  // Fetch shared weekly tasks for this group + selected week with full hierarchy
  const { data: rawTasks } = await supabase
    .from("weekly_tasks")
    .select(
      "id, user_id, title, description, status, progress, current_value, target_value, target_unit, week_start, monthly_goals(id, title, month_start, progress_pct, target_value, target_unit, goals(id, title, progress_pct)), goals(id, title, progress_pct)",
    )
    .eq("group_id", id)
    .eq("week_start", weekStartStr)
    .order("created_at", { ascending: true })

  const tasks = (rawTasks ?? []) as unknown as RecapTask[]
  const taskIds = tasks.map((t) => t.id)

  // Parallel: ratings (with rater profiles) + shared logs per task
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

  const sharedGoalCount    = tasks.length
  const groupCompletionPct =
    tasks.length === 0
      ? 0
      : Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
  const loggedWorkCount    = Object.values(logsMap).reduce(
    (sum, logs) => sum + logs.length,
    0,
  )
  const ratingsExpected    = tasks.length * Math.max(0, members.length - 1)
  const ratingsGiven       = allRatings.length

  // Active members: those with at least one shared task
  const activeUserIds   = new Set(tasks.map((t) => t.user_id))
  const activeMembers   = members.filter((m) => activeUserIds.has(m.user_id)).length

  // Members who actually logged progress (for narrative)
  const loggedUserIds = new Set<string>()
  for (const t of tasks) {
    if ((logsMap[t.id] ?? []).length > 0) loggedUserIds.add(t.user_id)
  }
  const loggedMembersCount = loggedUserIds.size

  // ── Missing reviews ───────────────────────────────────────────────────────

  const myRatedTaskIds = new Set(
    allRatings.filter((r) => r.rater_id === user.id).map((r) => r.weekly_task_id),
  )

  const missingReviews: RecapMissingReview[] = tasks
    .filter((t) => t.user_id !== user.id && !myRatedTaskIds.has(t.id))
    .map((t) => {
      const owner       = members.find((m) => m.user_id === t.user_id)
      const ownerHandle =
        owner?.profile?.username
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

  // ── Per-member recap data ─────────────────────────────────────────────────

  type MemberRecapRow = {
    member:          RecapMember
    tasks:           RecapTaskData[]
    sharedGoalCount: number
    avgProgress:     number
    avgRating:       number
    logCount:        number
    status:          RecapMemberStatus
  }

  const memberDataList: MemberRecapRow[] = members.map((member) => {
    const memberTasks = tasks.filter((t) => t.user_id === member.user_id)

    const taskDataList: RecapTaskData[] = memberTasks.map((task) => {
      const taskRatings = ratingsByTask[task.id] ?? []
      const ratingCount = taskRatings.length
      const avgRating   =
        ratingCount > 0
          ? taskRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
          : 0
      const myRating    = taskRatings.find((r) => r.rater_id === user.id)
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

    const goalCount   = memberTasks.length
    const avgProgress =
      goalCount > 0
        ? memberTasks.reduce((sum, t) => sum + t.progress, 0) / goalCount
        : 0

    const allTaskRatings = memberTasks.flatMap((t) => ratingsByTask[t.id] ?? [])
    const avgRating      =
      allTaskRatings.length > 0
        ? allTaskRatings.reduce((sum, r) => sum + r.rating, 0) / allTaskRatings.length
        : 0

    const logCount = memberTasks.reduce(
      (sum, t) => sum + (logsMap[t.id]?.length ?? 0),
      0,
    )

    const status: RecapMemberStatus =
      goalCount === 0
        ? "no_shared_goals"
        : avgProgress >= 80
          ? "completed_strong"
          : "in_progress"

    return {
      member,
      tasks:           taskDataList,
      sharedGoalCount: goalCount,
      avgProgress,
      avgRating,
      logCount,
      status,
    }
  })

  // ── Narrative summary ─────────────────────────────────────────────────────

  let narrativeSummary: string
  if (sharedGoalCount === 0) {
    narrativeSummary = "No shared weekly goals were posted for this week."
  } else {
    const parts: string[] = [
      `This week, the group shared ${sharedGoalCount} weekly ${sharedGoalCount === 1 ? "goal" : "goals"} with an average completion of ${groupCompletionPct}%.`,
    ]
    if (loggedMembersCount > 0) {
      parts.push(
        `${loggedMembersCount} ${loggedMembersCount === 1 ? "member" : "members"} logged progress.`,
      )
    }
    if (ratingsExpected > 0) {
      parts.push(
        `${ratingsGiven} of ${ratingsExpected} peer ${ratingsExpected === 1 ? "review was" : "reviews were"} submitted.`,
      )
    }
    narrativeSummary = parts.join(" ")
  }

  // ── Copy text (no private data) ───────────────────────────────────────────

  const recapText = buildRecapText(
    group.name,
    weekRange,
    sharedGoalCount,
    groupCompletionPct,
    loggedMembersCount,
    ratingsGiven,
    ratingsExpected,
    memberDataList,
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">
      {/* Header + week nav */}
      <WeeklyRecapHeader
        groupId={id}
        groupName={group.name}
        weekStartStr={weekStartStr}
        weekRange={weekRange}
        isCurrentWeek={isCurrentWeek}
      />

      {/* Summary cards */}
      <WeeklyRecapSummaryCards
        sharedGoalCount={sharedGoalCount}
        groupCompletionPct={groupCompletionPct}
        loggedWorkCount={loggedWorkCount}
        ratingsGiven={ratingsGiven}
        ratingsExpected={ratingsExpected}
        activeMembers={activeMembers}
        totalMembers={members.length}
      />

      {/* Narrative + copy */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">{narrativeSummary}</p>
        {sharedGoalCount > 0 && <CopyRecapButton recapText={recapText} />}
      </div>

      {/* Missing reviews */}
      <WeeklyRecapMissingReviews reviews={missingReviews} />

      {/* Member recap */}
      {tasks.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Member Recap
          </h2>
          <div className="flex flex-col gap-4">
            {memberDataList.map((md) => (
              <WeeklyRecapMemberCard
                key={md.member.user_id}
                member={md.member}
                tasks={md.tasks}
                currentUserId={user.id}
                sharedGoalCount={md.sharedGoalCount}
                avgProgress={md.avgProgress}
                avgRating={md.avgRating}
                logCount={md.logCount}
                status={md.status}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
