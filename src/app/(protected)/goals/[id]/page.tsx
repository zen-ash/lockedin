import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import GoalProgressBar from "@/components/goals/GoalProgressBar"
import DeleteGoalButton from "@/components/goals/DeleteGoalButton"
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/goals-schema"
import { MONTHLY_GOAL_STATUS_LABELS } from "@/lib/monthly-goals-schema"
import { STATUS_LABELS as TASK_STATUS_LABELS } from "@/lib/tasks-schema"
import { formatMonthStart } from "@/lib/utils/week"
import type { MonthlyGoal, WeeklyTask } from "@/types/app"

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

export default async function GoalDetailPage({
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

  const [{ data: goal }, { data: monthlyGoalsData }] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("monthly_goals")
      .select("*")
      .eq("goal_id", id)
      .eq("user_id", user.id)
      .order("month_start", { ascending: false }),
  ])

  if (!goal) notFound()

  const monthlyGoals = (monthlyGoalsData ?? []) as MonthlyGoal[]
  const monthlyGoalIds = monthlyGoals.map((mg) => mg.id)

  let weeklyTasks: WeeklyTask[] = []
  if (monthlyGoalIds.length > 0) {
    const { data } = await supabase
      .from("weekly_tasks")
      .select("*")
      .in("monthly_goal_id", monthlyGoalIds)
      .eq("user_id", user.id)
      .order("week_start", { ascending: true })
    weeklyTasks = (data ?? []) as WeeklyTask[]
  }

  // Group weekly tasks by monthly_goal_id
  const tasksByMonthlyGoalId = new Map<string, WeeklyTask[]>()
  for (const task of weeklyTasks) {
    if (!task.monthly_goal_id) continue
    const list = tasksByMonthlyGoalId.get(task.monthly_goal_id) ?? []
    list.push(task)
    tasksByMonthlyGoalId.set(task.monthly_goal_id, list)
  }

  // Weighted execution progress from monthly goals
  const totalWeight = monthlyGoals.reduce((s, mg) => s + mg.weight, 0)
  const executionProgress =
    totalWeight > 0
      ? Math.round(
          monthlyGoals.reduce((s, mg) => s + mg.progress_pct * mg.weight, 0) / totalWeight,
        )
      : goal.progress_pct

  const targetDate = goal.target_date
    ? new Date(goal.target_date + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null

  const createdAt = new Date(goal.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const updatedAt = new Date(goal.updated_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link
        href="/goals"
        className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Goals
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABELS[goal.category] ?? goal.category}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                STATUS_STYLES[goal.status] ?? STATUS_STYLES.abandoned,
              )}
            >
              {STATUS_LABELS[goal.status] ?? goal.status}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            {goal.title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/goals/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit
          </Link>
          <DeleteGoalButton goalId={id} />
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Execution Progress */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {monthlyGoals.length > 0 ? "Execution Progress" : "Progress"}
              </p>
              {monthlyGoals.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  weighted avg. from {monthlyGoals.length} monthly goal{monthlyGoals.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <GoalProgressBar value={executionProgress} className="flex-1" />
              <span className="ml-4 text-2xl font-bold text-foreground">
                {executionProgress}%
              </span>
            </div>
          </div>

          {/* Description */}
          {goal.description && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-2 text-sm font-medium text-foreground">Description</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {goal.description}
              </p>
            </div>
          )}

          {/* Monthly Milestones + Weekly Tasks */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Monthly Milestones
              </h2>
              <Link
                href={`/goals/${id}/monthly/new`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                + Add Monthly Goal
              </Link>
            </div>

            {monthlyGoals.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No monthly milestones yet. Break this goal into monthly milestones.
                </p>
                <Link
                  href={`/goals/${id}/monthly/new`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-3",
                  )}
                >
                  Add first monthly goal
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {monthlyGoals.map((mg) => {
                  const mgTasks = tasksByMonthlyGoalId.get(mg.id) ?? []
                  return (
                    <div
                      key={mg.id}
                      className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                      {/* Milestone header — links to monthly goal detail */}
                      <Link
                        href={`/monthly-goals/${mg.id}`}
                        className="group block px-4 py-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
                                {formatMonthStart(mg.month_start)}
                              </span>
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                                  STATUS_STYLES[mg.status] ?? STATUS_STYLES.abandoned,
                                )}
                              >
                                {MONTHLY_GOAL_STATUS_LABELS[mg.status] ?? mg.status}
                              </span>
                              {mg.weight !== 1 && (
                                <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  weight {mg.weight}
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                              {mg.title}
                            </p>
                            {mg.target_value != null && mg.target_value > 0 && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Target: {mg.target_value}
                                {mg.target_unit ? ` ${mg.target_unit}` : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <span className="text-sm font-semibold text-foreground">
                              {mg.progress_pct}%
                            </span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min(100, mg.progress_pct)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Weekly tasks nested under milestone */}
                      <div className="border-t border-border">
                        {mgTasks.length === 0 ? (
                          <div className="px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                              No weekly goals yet.{" "}
                              <Link
                                href="/tasks/new"
                                className="text-primary transition-colors hover:text-primary/80"
                              >
                                Create one
                              </Link>
                            </p>
                          </div>
                        ) : (
                          mgTasks.map((task, i) => (
                            <Link
                              key={task.id}
                              href={`/tasks/${task.id}`}
                              className={cn(
                                "group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/20",
                                i > 0 && "border-t border-border/50",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-2">
                                  <span className="mt-px shrink-0 text-xs text-muted-foreground/50">
                                    ↳
                                  </span>
                                  <p className="truncate text-sm text-foreground transition-colors group-hover:text-primary">
                                    {task.title}
                                  </p>
                                </div>
                                {task.target_value != null && task.target_value > 0 && (
                                  <p className="ml-4 text-xs text-muted-foreground">
                                    {task.current_value} / {task.target_value}
                                    {task.target_unit ? ` ${task.target_unit}` : ""}
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[11px] font-medium text-foreground">
                                    {Math.min(100, task.progress)}%
                                  </span>
                                  <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
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
                                  {TASK_STATUS_LABELS[task.status] ?? task.status}
                                </span>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Meta sidebar */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <dl className="flex flex-col gap-4">
              {targetDate && (
                <div>
                  <dt className="text-xs text-muted-foreground">Target Date</dt>
                  <dd className="mt-0.5 text-sm font-medium text-foreground">
                    {targetDate}
                  </dd>
                </div>
              )}
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
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
