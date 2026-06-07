import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import GoalProgressBar from "@/components/goals/GoalProgressBar"
import DeleteMonthlyGoalButton from "@/components/monthly-goals/DeleteMonthlyGoalButton"
import {
  MONTHLY_GOAL_STATUS_LABELS,
  MONTHLY_GOAL_CATEGORY_LABELS,
} from "@/lib/monthly-goals-schema"
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/tasks-schema"
import { formatMonthStart } from "@/lib/utils/week"
import {
  getWeightLabel,
  getWeightExplanation,
  getWeightBadgeClasses,
} from "@/lib/utils/weight-suggestions"
import type { WeeklyTask } from "@/types/app"

const STATUS_STYLES: Record<string, string> = {
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

export default async function MonthlyGoalDetailPage({
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

  const [{ data: mg }, { data: weeklyTasksData }] = await Promise.all([
    supabase
      .from("monthly_goals")
      .select("*, goals(id, title)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("weekly_tasks")
      .select("*")
      .eq("monthly_goal_id", id)
      .eq("user_id", user.id)
      .order("week_start", { ascending: true }),
  ])

  if (!mg) notFound()

  const parentGoal = (mg.goals as { id: string; title: string } | null)
  const weeklyTasks = (weeklyTasksData ?? []) as WeeklyTask[]

  const createdAt = new Date(mg.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const updatedAt = new Date(mg.updated_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      {parentGoal && (
        <Link
          href={`/goals/${parentGoal.id}`}
          className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {parentGoal.title}
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
              {formatMonthStart(mg.month_start)}
            </span>
            {mg.category && (
              <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {MONTHLY_GOAL_CATEGORY_LABELS[mg.category] ?? mg.category}
              </span>
            )}
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                STATUS_STYLES[mg.status] ?? STATUS_STYLES.abandoned,
              )}
            >
              {MONTHLY_GOAL_STATUS_LABELS[mg.status] ?? mg.status}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            {mg.title}
          </h1>
          {parentGoal && (
            <p className="text-sm text-muted-foreground">
              Under{" "}
              <Link
                href={`/goals/${parentGoal.id}`}
                className="text-primary transition-colors hover:text-primary/80"
              >
                {parentGoal.title}
              </Link>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/monthly-goals/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit
          </Link>
          <DeleteMonthlyGoalButton monthlyGoalId={id} />
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Progress */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Progress</p>
              {mg.target_value != null && mg.target_value > 0 && (
                <span className="text-xs text-muted-foreground">
                  auto-calculated from weekly goals
                </span>
              )}
            </div>
            {mg.target_value != null && mg.target_value > 0 ? (
              <>
                <div className="mb-3 flex items-end gap-1.5">
                  <span className="text-3xl font-bold text-foreground">
                    {weeklyTasks.reduce((s, t) => s + t.current_value, 0)}
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">
                    / {mg.target_value}
                    {mg.target_unit ? ` ${mg.target_unit}` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <GoalProgressBar value={mg.progress_pct} className="flex-1" />
                  <span className="ml-4 text-2xl font-bold text-foreground">
                    {mg.progress_pct}%
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <GoalProgressBar value={mg.progress_pct} className="flex-1" />
                <span className="ml-4 text-2xl font-bold text-foreground">
                  {mg.progress_pct}%
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {mg.description && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-2 text-sm font-medium text-foreground">Description</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {mg.description}
              </p>
            </div>
          )}

          {/* Weekly Goals */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Weekly Goals
              </h2>
              <Link
                href="/tasks/new"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                + Add Weekly Goal
              </Link>
            </div>

            {weeklyTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No weekly goals yet. Create weekly goals and link them to this monthly goal.
                </p>
                <Link
                  href="/tasks/new"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-3",
                  )}
                >
                  Create a weekly goal
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {weeklyTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {task.title}
                      </p>
                      {task.target_value != null && task.target_value > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {task.current_value} / {task.target_value}
                          {task.target_unit ? ` ${task.target_unit}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium text-foreground">
                          {Math.min(100, task.progress)}%
                        </span>
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, task.progress)}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          TASK_STATUS_STYLES[task.status] ?? TASK_STATUS_STYLES.pending,
                        )}
                      >
                        {STATUS_LABELS[task.status] ?? task.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meta sidebar */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs text-muted-foreground">Month</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {formatMonthStart(mg.month_start)}
                </dd>
              </div>
              {mg.target_value != null && (
                <div>
                  <dt className="text-xs text-muted-foreground">Target</dt>
                  <dd className="mt-0.5 text-sm font-medium text-foreground">
                    {mg.target_value}
                    {mg.target_unit ? ` ${mg.target_unit}` : ""}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">Impact</dt>
                <dd className="mt-1">
                  <span className={getWeightBadgeClasses(mg.weight)}>
                    {getWeightLabel(mg.weight)}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getWeightExplanation(mg.weight)}
                  </p>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {createdAt}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last Updated</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {updatedAt}
                </dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                Progress is auto-calculated from linked weekly goals.
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
