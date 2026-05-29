import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import LockBadge from "@/components/tasks/LockBadge"
import LockCountdown from "@/components/tasks/LockCountdown"
import TaskProgressUpdate from "@/components/tasks/TaskProgressUpdate"
import DeleteTaskButton from "@/components/tasks/DeleteTaskButton"
import ProgressSummaryCard from "@/components/progress/ProgressSummaryCard"
import ProgressLogForm from "@/components/progress/ProgressLogForm"
import ProgressLogList from "@/components/progress/ProgressLogList"
import SharedProgressLogList from "@/components/progress/SharedProgressLogList"
import RatingForm from "@/components/ratings/RatingForm"
import RatingsSummary from "@/components/ratings/RatingsSummary"
import RatingsList from "@/components/ratings/RatingsList"
import {
  getWeekLockTimeUTC,
  isWeekLocked,
  formatMonthStart,
  LOCK_ENABLED,
} from "@/lib/utils/week"
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/lib/tasks-schema"
import type { TaskStatus } from "@/lib/tasks-schema"
import type { WeeklyTask, SharedProgressLog, WeeklyGoalRatingWithRater } from "@/types/app"

const STATUS_STYLES: Record<string, string> = {
  pending:     "border-border bg-muted/50 text-muted-foreground",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  completed:   "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  missed:      "border-destructive/30 bg-destructive/10 text-destructive",
}

const PRIORITY_STYLES: Record<string, string> = {
  high:   "border-destructive/30 bg-destructive/10 text-destructive",
  medium: "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  low:    "border-border bg-muted/50 text-muted-foreground",
}

type ParentGoal = {
  id:          string
  title:       string
  progress_pct: number
  target_date: string | null
  status:      string
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

type TaskDetail = WeeklyTask & {
  monthly_goals: ParentMonthlyGoal | null
  goals:         ParentGoal | null
  groups:        { id: string; name: string } | null
}

type OwnerProfile = {
  id:         string
  username:   string | null
  full_name:  string | null
  avatar_url: string | null
}

type LogItem = {
  id:             string
  log_date:       string
  value_added:    number
  note:           string | null
  is_note_shared: boolean
  updated_at:     string
  created_at:     string
  user_id:        string
  weekly_task_id: string
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: rawTask } = await supabase
    .from("weekly_tasks")
    .select(
      "*, monthly_goals(id, title, month_start, progress_pct, target_value, target_unit, goals(id, title, progress_pct, target_date, status)), goals(id, title, progress_pct, target_date, status), groups(id, name)",
    )
    .eq("id", id)
    .single()

  const task = rawTask as TaskDetail | null
  if (!task) notFound()

  const isOwner = task.user_id === user.id

  const mg         = task.monthly_goals
  const goalDirect = task.goals as ParentGoal | null

  const weekStart = new Date(task.week_start + "T00:00:00Z")
  const locked    = isWeekLocked(weekStart)
  const lockTime  = getWeekLockTimeUTC(weekStart)

  const dueDate = task.due_date
    ? new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day:   "numeric",
        year:  "numeric",
      })
    : null

  const createdAt = new Date(task.created_at).toLocaleDateString("en-US", {
    month: "long",
    day:   "numeric",
    year:  "numeric",
  })

  // ── Owner full view ────────────────────────────────────────────────────────
  if (isOwner) {
    const [{ data: logsData }, ratingsData] = await Promise.all([
      supabase
        .from("daily_progress_logs")
        .select("*")
        .eq("weekly_task_id", id)
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false }),
      // Only fetch ratings if group-shared
      task.group_id
        ? supabase
            .from("weekly_goal_ratings")
            .select("*, profiles(username, full_name)")
            .eq("weekly_task_id", id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    const logs    = (logsData ?? []) as LogItem[]
    const ratings = (ratingsData.data ?? []) as WeeklyGoalRatingWithRater[]

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
        : 0

    let hierarchyLabel: string | null = null
    if (mg) {
      const parentGoalTitle = (mg.goals as ParentGoal | null)?.title ?? "Unknown Goal"
      hierarchyLabel = `${parentGoalTitle} → ${formatMonthStart(mg.month_start)}: ${mg.title}`
    } else if (goalDirect) {
      hierarchyLabel = `Goal: ${goalDirect.title}`
    }

    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/tasks"
          className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Weekly Goals
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {task.category && (
                <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {CATEGORY_LABELS[task.category] ?? task.category}
                </span>
              )}
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  STATUS_STYLES[task.status] ?? STATUS_STYLES.pending,
                )}
              >
                {STATUS_LABELS[task.status] ?? task.status}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium,
                )}
              >
                {PRIORITY_LABELS[task.priority] ?? task.priority}
              </span>
              {task.groups && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                  {task.groups.name}
                </span>
              )}
              <LockBadge locked={locked} />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              {task.title}
            </h1>
            <div>
              {LOCK_ENABLED
                ? (!locked && <LockCountdown lockTime={lockTime.toISOString()} />)
                : (
                  <span className="text-xs text-muted-foreground">
                    Lock disabled (dev mode)
                  </span>
                )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!locked && (
              <Link
                href={`/tasks/${id}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Edit
              </Link>
            )}
            <DeleteTaskButton taskId={id} locked={locked} />
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <ProgressSummaryCard
              currentValue={task.current_value}
              targetValue={task.target_value}
              targetUnit={task.target_unit}
              progressPct={task.progress}
            />

            {task.description && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-2 text-sm font-medium text-foreground">Description</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {task.description}
                </p>
              </div>
            )}

            {task.reflection && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-2 text-sm font-medium text-foreground">Reflection</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {task.reflection}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-medium text-foreground">Log Progress</p>
              <ProgressLogForm
                weeklyTaskId={id}
                targetUnit={task.target_unit}
                isGroupShared={!!task.group_id}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-medium text-foreground">Progress History</p>
              <ProgressLogList logs={logs} targetUnit={task.target_unit} />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-medium text-foreground">Update Status</p>
              <TaskProgressUpdate
                taskId={id}
                defaultValues={{
                  status:     task.status as TaskStatus,
                  reflection: task.reflection ?? "",
                }}
              />
            </div>

            {/* Ratings received — only shown when shared with a group */}
            {task.group_id && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-medium text-foreground">
                  Peer Reviews
                </p>
                <div className="mb-4">
                  <RatingsSummary average={avgRating} count={ratings.length} />
                </div>
                <RatingsList ratings={ratings} />
              </div>
            )}
          </div>

          {/* Meta sidebar */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <dl className="flex flex-col gap-4">
                {task.groups && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Accountability Group</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">
                      <Link
                        href={`/groups/${task.group_id}`}
                        className="text-primary transition-colors hover:text-primary/80"
                      >
                        {task.groups.name}
                      </Link>
                    </dd>
                  </div>
                )}
                {hierarchyLabel && (
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {mg ? "Monthly Goal" : "Linked Goal"}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">
                      {mg ? (
                        <Link
                          href={`/monthly-goals/${mg.id}`}
                          className="text-primary transition-colors hover:text-primary/80"
                        >
                          {hierarchyLabel}
                        </Link>
                      ) : (
                        hierarchyLabel.replace("Goal: ", "")
                      )}
                    </dd>
                  </div>
                )}
                {task.target_value != null && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Target</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">
                      {task.target_value}
                      {task.target_unit ? ` ${task.target_unit}` : ""}
                    </dd>
                  </div>
                )}
                {dueDate && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Due Date</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">{dueDate}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd className="mt-0.5 text-sm font-medium text-foreground">{createdAt}</dd>
                </div>
                {locked && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-muted-foreground">
                    Structural fields are locked. You can still log progress and update status above.
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Group-member read-only view ────────────────────────────────────────────
  // RLS guarantees task.group_id is non-null for non-owners (SELECT policy)
  const [ownerProfileResult, sharedLogsResult, ratingsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .eq("id", task.user_id)
      .single(),
    supabase.rpc("get_shared_progress_logs", { p_weekly_task_id: id }),
    supabase
      .from("weekly_goal_ratings")
      .select("*, profiles(username, full_name)")
      .eq("weekly_task_id", id)
      .order("created_at", { ascending: false }),
  ])

  const ownerProfile = ownerProfileResult.data as OwnerProfile | null
  const sharedLogs   = (sharedLogsResult.data ?? []) as SharedProgressLog[]
  const ratings      = (ratingsResult.data ?? []) as WeeklyGoalRatingWithRater[]

  const myExistingRating = ratings.find((r) => r.rater_id === user.id)

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0

  const ownerHandle = ownerProfile?.username
    ? `@${ownerProfile.username}`
    : (ownerProfile?.full_name ?? "Unknown member")

  const parentGoalFromMg   = (mg?.goals as ParentGoal | null) ?? null
  const effectiveParentGoal = parentGoalFromMg ?? goalDirect

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/groups/${task.group_id}`}
        className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to group
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {task.category && (
            <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABELS[task.category] ?? task.category}
            </span>
          )}
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              STATUS_STYLES[task.status] ?? STATUS_STYLES.pending,
            )}
          >
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium,
            )}
          >
            {PRIORITY_LABELS[task.priority] ?? task.priority}
          </span>
          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            View only
          </span>
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          {task.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          by {ownerHandle}
          {task.groups && (
            <span> · {task.groups.name}</span>
          )}
        </p>
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Progress */}
          <ProgressSummaryCard
            currentValue={task.current_value}
            targetValue={task.target_value}
            targetUnit={task.target_unit}
            progressPct={task.progress}
          />

          {/* Description */}
          {task.description && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-2 text-sm font-medium text-foreground">Description</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {task.description}
              </p>
            </div>
          )}

          {/* Parent context */}
          {(effectiveParentGoal || mg) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-sm font-medium text-foreground">Goal Context</p>
              <div className="flex flex-col gap-3">
                {effectiveParentGoal && (
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Long-Term Goal
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {effectiveParentGoal.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${effectiveParentGoal.progress_pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {effectiveParentGoal.progress_pct}%
                      </span>
                    </div>
                  </div>
                )}
                {mg && (
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Monthly Goal · {formatMonthStart(mg.month_start)}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {mg.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${mg.progress_pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {mg.progress_pct}%
                        {mg.target_value != null && (
                          <span className="ml-1">
                            · {mg.target_value}{mg.target_unit ? ` ${mg.target_unit}` : ""}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shared daily work */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-4 text-sm font-medium text-foreground">Daily Work</p>
            <SharedProgressLogList logs={sharedLogs} targetUnit={task.target_unit} />
          </div>

          {/* Rate this goal */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-4 text-sm font-medium text-foreground">
              {myExistingRating ? "Your Review" : "Rate This Goal"}
            </p>
            <RatingForm
              weeklyTaskId={id}
              existingRating={
                myExistingRating
                  ? { id: myExistingRating.id, rating: myExistingRating.rating, comment: myExistingRating.comment }
                  : undefined
              }
            />
          </div>

          {/* All reviews */}
          {ratings.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-foreground">Peer Reviews</p>
                <RatingsSummary average={avgRating} count={ratings.length} />
              </div>
              <RatingsList ratings={ratings} />
            </div>
          )}
        </div>

        {/* Meta sidebar */}
        <div>
          <div className="rounded-xl border border-border bg-card p-5">
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">{ownerHandle}</dd>
              </div>
              {task.groups && (
                <div>
                  <dt className="text-xs text-muted-foreground">Group</dt>
                  <dd className="mt-0.5 text-sm font-medium text-foreground">
                    <Link
                      href={`/groups/${task.group_id}`}
                      className="text-primary transition-colors hover:text-primary/80"
                    >
                      {task.groups.name}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">Week</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {new Date(task.week_start + "T00:00:00Z").toLocaleDateString("en-US", {
                    month: "long",
                    day:   "numeric",
                    year:  "numeric",
                  })}
                </dd>
              </div>
              {task.target_value != null && (
                <div>
                  <dt className="text-xs text-muted-foreground">Target</dt>
                  <dd className="mt-0.5 text-sm font-medium text-foreground">
                    {task.target_value}
                    {task.target_unit ? ` ${task.target_unit}` : ""}
                  </dd>
                </div>
              )}
              {dueDate && (
                <div>
                  <dt className="text-xs text-muted-foreground">Due Date</dt>
                  <dd className="mt-0.5 text-sm font-medium text-foreground">{dueDate}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
