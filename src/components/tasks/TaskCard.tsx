import Link from "next/link"
import { cn } from "@/lib/utils"
import LockBadge from "./LockBadge"
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks-schema"
import { formatMonthStart } from "@/lib/utils/week"
import type { TaskWithHierarchy } from "@/types/app"

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

function getHierarchyLabel(task: TaskWithHierarchy): string | null {
  if (task.monthly_goals) {
    const goalTitle = task.monthly_goals.goals?.title ?? "Unknown Goal"
    const month     = formatMonthStart(task.monthly_goals.month_start)
    return `${goalTitle} → ${month}: ${task.monthly_goals.title}`
  }
  if (task.goals) {
    return `Goal: ${task.goals.title}`
  }
  return null
}

interface TaskCardProps {
  task: TaskWithHierarchy
  locked: boolean
}

export default function TaskCard({ task, locked }: TaskCardProps) {
  const hierarchyLabel = getHierarchyLabel(task)

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {task.title}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            STATUS_STYLES[task.status] ?? STATUS_STYLES.pending,
          )}
        >
          {STATUS_LABELS[task.status] ?? task.status}
        </span>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {task.category && (
          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[task.category] ?? task.category}
          </span>
        )}
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

      {/* Progress bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-medium text-foreground">
            {task.target_value != null && task.target_value > 0
              ? `${task.current_value} / ${task.target_value}${task.target_unit ? ` ${task.target_unit}` : ""}`
              : `${Math.min(100, task.progress)}%`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(100, task.progress)}%` }}
          />
        </div>
      </div>

      {/* Footer: hierarchy label + due date */}
      {(hierarchyLabel || task.due_date) && (
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {hierarchyLabel && (
            <span className="line-clamp-1">{hierarchyLabel}</span>
          )}
          {task.due_date && (
            <span className="shrink-0">
              Due:{" "}
              {new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day:   "numeric",
              })}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
