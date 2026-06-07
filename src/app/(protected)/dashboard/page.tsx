import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import GoalProgressBar from "@/components/goals/GoalProgressBar"
import LockBadge from "@/components/tasks/LockBadge"
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/goals-schema"
import { STATUS_LABELS as TASK_STATUS_LABELS } from "@/lib/tasks-schema"
import { MONTHLY_GOAL_STATUS_LABELS } from "@/lib/monthly-goals-schema"
import {
  getCurrentWeekStartUTC,
  formatDateForSupabase,
  isWeekLocked,
  formatWeekRange,
  formatMonthStart,
} from "@/lib/utils/week"
import type { TaskWithHierarchy } from "@/types/app"

const GOAL_STATUS_STYLES: Record<string, string> = {
  active:    "border-primary/30 bg-primary/10 text-primary",
  completed: "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  paused:    "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  abandoned: "border-border bg-muted/50 text-muted-foreground",
}

const MG_STATUS_STYLES: Record<string, string> = {
  active:    "border-primary/30 bg-primary/10 text-primary",
  completed: "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  paused:    "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  abandoned: "border-border bg-muted/50 text-muted-foreground",
}

const TASK_STATUS_STYLES: Record<string, string> = {
  pending:     "border-border bg-muted/50 text-muted-foreground",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  completed:   "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  missed:      "border-destructive/30 bg-destructive/10 text-destructive",
}

type MilestoneGroup = {
  milestoneId:       string | null
  milestoneTitle:    string | null
  milestoneMonthStr: string | null
  tasks:             TaskWithHierarchy[]
}

type GoalGroup = {
  goalTitle:  string
  milestones: MilestoneGroup[]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const weekStart     = getCurrentWeekStartUTC()
  const weekStartStr  = formatDateForSupabase(weekStart)
  const weekLocked    = isWeekLocked(weekStart)
  const weekRange     = formatWeekRange(weekStart)

  const now             = new Date()
  const currentMonth    = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const currentMonthStr = formatDateForSupabase(currentMonth)

  const [
    { data: profile },
    { data: goalsData },
    { data: tasksData },
    { data: monthlyGoalsData },
    { data: groupMemberships },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("goals")
      .select("id, title, status, progress_pct, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("weekly_tasks")
      .select("*, monthly_goals(id, title, month_start, goals(title)), goals(title), groups(id, name)")
      .eq("user_id", user.id)
      .eq("week_start", weekStartStr)
      .order("created_at", { ascending: false }),
    supabase
      .from("monthly_goals")
      .select("id, title, status, progress_pct, goals(id, title)")
      .eq("user_id", user.id)
      .eq("month_start", currentMonthStr)
      .order("created_at", { ascending: false }),
    supabase
      .from("group_members")
      .select("group_id, groups(id, name)")
      .eq("user_id", user.id),
  ])

  const goals               = goalsData ?? []
  const tasks               = (tasksData ?? []) as unknown as TaskWithHierarchy[]
  const currentMonthlyGoals = monthlyGoalsData ?? []
  const groupCount          = (groupMemberships ?? []).length
  const latestGroupRow      = (groupMemberships ?? [])[0] as
    | { group_id: string; groups: { id: string; name: string } | null }
    | undefined
  const latestGroup = latestGroupRow?.groups ?? null

  // ── Stats (all goals) ──────────────────────────────────────────────────────
  const activeCount    = goals.filter((g) => g.status === "active").length
  const completedCount = goals.filter((g) => g.status === "completed").length
  const avgProgress    =
    goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + g.progress_pct, 0) / goals.length)
      : 0

  // ── Active goals section (up to 6) ────────────────────────────────────────
  const activeGoals = goals.filter((g) => g.status === "active").slice(0, 6)

  // ── Weekly task stats ─────────────────────────────────────────────────────
  const taskTotal          = tasks.length
  const taskCompletedCount = tasks.filter((t) => t.status === "completed").length
  const taskCompletionPct  =
    taskTotal > 0 ? Math.round((taskCompletedCount / taskTotal) * 100) : 0

  // ── Group tasks: Goal → Milestone → Tasks ─────────────────────────────────
  // Blueprint tasks have goal_id null — their goal is reached via monthly_goals.goals.title.
  // Manual tasks may have either or both links populated.
  const goalMap = new Map<string, Map<string, MilestoneGroup>>()

  for (const task of tasks) {
    const goalTitle =
      task.monthly_goals?.goals?.title ??
      task.goals?.title ??
      "No Goal"

    const milestoneId       = task.monthly_goals?.id ?? null
    const milestoneTitle    = task.monthly_goals?.title ?? null
    const milestoneMonthStr = task.monthly_goals?.month_start
      ? formatMonthStart(task.monthly_goals.month_start)
      : null

    if (!goalMap.has(goalTitle)) {
      goalMap.set(goalTitle, new Map())
    }
    const milestoneMap = goalMap.get(goalTitle)!
    const key = milestoneId ?? "__standalone__"

    if (!milestoneMap.has(key)) {
      milestoneMap.set(key, { milestoneId, milestoneTitle, milestoneMonthStr, tasks: [] })
    }
    milestoneMap.get(key)!.tasks.push(task)
  }

  const goalGroups: GoalGroup[] = Array.from(goalMap.entries()).map(
    ([goalTitle, milestoneMap]) => ({
      goalTitle,
      milestones: Array.from(milestoneMap.values()),
    }),
  )

  const sharedTasks = tasks.filter((t) => t.groups != null)

  return (
    <div className="flex flex-col gap-8">

      {/* ── Welcome ─────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Welcome back,{" "}
          <span className="italic text-primary">@{profile?.username}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your accountability journal.
        </p>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Goals",    value: activeCount    > 0 ? String(activeCount)    : "—" },
          { label: "Completed Goals", value: completedCount > 0 ? String(completedCount) : "—" },
          { label: "Avg. Progress",   value: goals.length   > 0 ? `${avgProgress}%`      : "—" },
          { label: "This Week",       value: taskTotal      > 0 ? `${taskCompletionPct}%` : "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Active Goals ────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Active Goals
          </h2>
          <Link
            href="/goals"
            className="text-xs text-primary transition-colors hover:text-primary/80"
          >
            View all →
          </Link>
        </div>

        {activeGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-sm font-medium text-foreground">No active goals yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set long-term objectives and track your monthly execution.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/goals/new"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Set a goal
              </Link>
              <Link
                href="/blueprint/new"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Generate blueprint →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => (
              <Link
                key={goal.id}
                href={`/goals/${goal.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                    {goal.title}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      GOAL_STATUS_STYLES[goal.status] ?? GOAL_STATUS_STYLES.abandoned,
                    )}
                  >
                    {STATUS_LABELS[goal.status] ?? goal.status}
                  </span>
                </div>
                {goal.category && (
                  <span className="w-fit rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {CATEGORY_LABELS[goal.category] ?? goal.category}
                  </span>
                )}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Progress</span>
                    <span className="text-[11px] font-medium text-foreground">
                      {goal.progress_pct}%
                    </span>
                  </div>
                  <GoalProgressBar value={goal.progress_pct} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── This Month's Milestones ─────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            This Month's Milestones
          </h2>
          <span className="text-xs text-muted-foreground">
            {formatMonthStart(currentMonthStr)}
          </span>
        </div>

        {currentMonthlyGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No monthly goals for {formatMonthStart(currentMonthStr)}.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Open a goal and add monthly milestones to track your monthly execution.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {currentMonthlyGoals.slice(0, 4).map((mg) => {
              const parentGoal = mg.goals as { id: string; title: string } | null
              return (
                <Link
                  key={mg.id}
                  href={`/monthly-goals/${mg.id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {mg.title}
                    </p>
                    {parentGoal && (
                      <p className="truncate text-xs text-muted-foreground">
                        {parentGoal.title}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {mg.progress_pct}%
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        MG_STATUS_STYLES[mg.status] ?? MG_STATUS_STYLES.abandoned,
                      )}
                    >
                      {MONTHLY_GOAL_STATUS_LABELS[mg.status] ?? mg.status}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── This Week's Goals — Execution Section ───────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              This Week's Goals
            </h2>
            <LockBadge locked={weekLocked} />
          </div>
          <Link
            href="/tasks"
            className="text-xs text-primary transition-colors hover:text-primary/80"
          >
            View all →
          </Link>
        </div>

        {taskTotal === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {weekLocked
                ? "No weekly goals were added for this week."
                : "No weekly tasks scheduled for this week."}
            </p>
            {!weekLocked && (
              <div className="mt-3 flex items-center gap-3">
                <Link
                  href="/tasks/new"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Add a weekly goal
                </Link>
                <Link
                  href="/blueprint/new"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Generate blueprint →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Completion summary bar */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{weekRange}</span>
                <span className="font-medium text-foreground">
                  {taskCompletedCount} / {taskTotal} completed
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${taskCompletionPct}%` }}
                />
              </div>
              <p className="mt-2 text-right text-lg font-bold text-foreground">
                {taskCompletionPct}%
              </p>
            </div>

            {/* Tasks grouped by Goal → Monthly Milestone */}
            <div className="flex flex-col gap-3">
              {goalGroups.map((group) => (
                <div
                  key={group.goalTitle}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  {/* Goal header */}
                  <div className="border-b border-border bg-muted/30 px-4 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {group.goalTitle}
                    </p>
                  </div>

                  {/* Milestone groups within this goal */}
                  <div className="divide-y divide-border/40">
                    {group.milestones.map((milestone) => (
                      <div key={milestone.milestoneId ?? "__standalone__"}>
                        {/* Monthly milestone sub-header */}
                        <div className="flex items-center gap-2 border-b border-border/30 bg-muted/10 px-4 py-2">
                          {milestone.milestoneTitle ? (
                            <>
                              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                                {milestone.milestoneMonthStr}
                              </span>
                              <span className="text-[10px] text-muted-foreground/40">·</span>
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {milestone.milestoneTitle}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                              Standalone weekly goals
                            </span>
                          )}
                        </div>

                        {/* Task rows */}
                        <div className="divide-y divide-border/20">
                          {milestone.tasks.map((task) => {
                            const progressClamped = Math.min(100, Math.round(task.progress))
                            const hasTarget =
                              task.target_value != null && task.target_value > 0
                            const weekOf = new Date(
                              task.week_start + "T00:00:00Z",
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day:   "numeric",
                              timeZone: "UTC",
                            })

                            return (
                              <Link
                                key={task.id}
                                href={`/tasks/${task.id}`}
                                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20"
                              >
                                {/* Status indicator dot */}
                                <span
                                  className={cn(
                                    "mt-px h-2 w-2 shrink-0 rounded-full",
                                    task.status === "completed" && "bg-emerald-500",
                                    task.status === "in_progress" && "bg-primary",
                                    task.status === "missed" && "bg-destructive",
                                    task.status === "pending" && "bg-muted-foreground/30",
                                  )}
                                />

                                {/* Title + progress details */}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                                    {task.title}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-1.5">
                                    {hasTarget ? (
                                      <span className="text-[11px] text-muted-foreground">
                                        {task.current_value} / {task.target_value}
                                        {task.target_unit ? ` ${task.target_unit}` : ""}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-muted-foreground">
                                        {progressClamped}%
                                      </span>
                                    )}
                                    <span className="text-[11px] text-muted-foreground/40">·</span>
                                    <span className="text-[11px] text-muted-foreground/60">
                                      Week of {weekOf}
                                    </span>
                                  </div>
                                  {/* Per-task progress bar */}
                                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all",
                                        task.status === "completed"
                                          ? "bg-emerald-500"
                                          : task.status === "missed"
                                            ? "bg-destructive/60"
                                            : "bg-primary",
                                      )}
                                      style={{ width: `${progressClamped}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Status badge */}
                                <span
                                  className={cn(
                                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                                    TASK_STATUS_STYLES[task.status] ?? TASK_STATUS_STYLES.pending,
                                  )}
                                >
                                  {TASK_STATUS_LABELS[task.status] ?? task.status}
                                </span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Shared Weekly Goals ─────────────────────────────────────────────── */}
      {sharedTasks.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Shared Weekly Goals
            </h2>
            <Link
              href="/tasks"
              className="text-xs text-primary transition-colors hover:text-primary/80"
            >
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {sharedTasks.slice(0, 4).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                    {task.title}
                  </p>
                  {task.groups && (
                    <p className="truncate text-xs text-muted-foreground">
                      {task.groups.name}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {task.target_value != null && task.target_value > 0
                      ? `${task.current_value} / ${task.target_value}${task.target_unit ? ` ${task.target_unit}` : ""}`
                      : `${Math.min(100, Math.round(task.progress))}%`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {TASK_STATUS_LABELS[task.status] ?? task.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Groups summary ──────────────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Groups
          </h2>
          <Link
            href="/groups"
            className="text-xs text-primary transition-colors hover:text-primary/80"
          >
            View all →
          </Link>
        </div>

        {groupCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">No groups yet.</p>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href="/groups/new"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Create a group
              </Link>
              <Link
                href="/groups/join"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Join with invite code
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold text-foreground">{groupCount}</p>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {groupCount === 1 ? "group" : "groups"}
                </p>
                {latestGroup && (
                  <p className="text-xs text-muted-foreground">
                    Latest:{" "}
                    <Link
                      href={`/groups/${latestGroup.id}`}
                      className="text-primary hover:text-primary/80"
                    >
                      {latestGroup.name}
                    </Link>
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/groups"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Open
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
