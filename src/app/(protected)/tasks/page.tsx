import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import LockBadge from "@/components/tasks/LockBadge"
import LockCountdown from "@/components/tasks/LockCountdown"
import WeeklyTaskList from "@/components/tasks/WeeklyTaskList"
import {
  getCurrentWeekStartUTC,
  getWeekLockTimeUTC,
  isWeekLocked,
  formatDateForSupabase,
  formatWeekRange,
  LOCK_ENABLED,
} from "@/lib/utils/week"
import { TASK_STATUSES, STATUS_LABELS } from "@/lib/tasks-schema"
import type { TaskWithHierarchy } from "@/types/app"

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const safeStatus = TASK_STATUSES.includes(status as never) ? status : undefined

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const weekStart    = getCurrentWeekStartUTC()
  const weekStartStr = formatDateForSupabase(weekStart)
  const locked       = isWeekLocked(weekStart)
  const lockTime     = getWeekLockTimeUTC(weekStart)
  const weekRange    = formatWeekRange(weekStart)

  let query = supabase
    .from("weekly_tasks")
    .select("*, monthly_goals(id, title, month_start, goals(title)), goals(title), groups(id, name)")
    .eq("user_id", user.id)
    .eq("week_start", weekStartStr)
    .order("created_at", { ascending: false })

  if (safeStatus) query = query.eq("status", safeStatus)

  const { data } = await query
  const tasks = (data ?? []) as unknown as TaskWithHierarchy[]

  const total          = tasks.length
  const completedCount = tasks.filter((t) => t.status === "completed").length
  const pendingCount   = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length
  const missedCount    = tasks.filter((t) => t.status === "missed").length
  const completionPct  = total > 0 ? Math.round((completedCount / total) * 100) : 0
  const isFiltered     = !!safeStatus

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Weekly Goals
          </p>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              Make this week <span className="italic text-primary">count.</span>
            </h1>
            <LockBadge locked={locked} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{weekRange}</p>
          <div className="mt-1">
            {LOCK_ENABLED
              ? (!locked && <LockCountdown lockTime={lockTime.toISOString()} />)
              : (
                <span className="text-xs text-muted-foreground">
                  Lock disabled (dev mode)
                </span>
              )}
          </div>
        </div>
        {!locked && (
          <Link
            href="/tasks/new"
            className={cn(buttonVariants({ variant: "default" }), "mt-1 shrink-0")}
          >
            New Weekly Goal
          </Link>
        )}
      </div>

      {/* Stats */}
      {total > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Completion", value: `${completionPct}%` },
              { label: "Completed",  value: String(completedCount) },
              { label: "Pending",    value: String(pendingCount) },
              { label: "Missed",     value: String(missedCount) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Week Completion</span>
              <span className="font-medium text-foreground">
                {completedCount} / {total}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/tasks"
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            !isFiltered
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </Link>
        {TASK_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/tasks?status=${s}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              safeStatus === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Content */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {isFiltered
              ? "No weekly goals match this filter."
              : "No weekly goals for this week."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFiltered
              ? "Try clearing the filter above."
              : locked
                ? "This week is locked. New weekly goals can be added next week."
                : "Lock in your weekly commitments."}
          </p>
          {!isFiltered && !locked && (
            <Link
              href="/tasks/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-5",
              )}
            >
              Create a weekly goal
            </Link>
          )}
        </div>
      ) : (
        <WeeklyTaskList tasks={tasks} locked={locked} />
      )}
    </div>
  )
}
