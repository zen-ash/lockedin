import Link from "next/link"
import { cn } from "@/lib/utils"
import GoalProgressBar from "@/components/goals/GoalProgressBar"
import { CATEGORY_LABELS } from "@/lib/goals-schema"
import type { Goal } from "@/types/app"

const STATUS_STYLES: Record<string, string> = {
  active:    "border-primary/30 bg-primary/10 text-primary",
  completed: "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  paused:    "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  abandoned: "border-border bg-muted/50 text-muted-foreground",
}

const STATUS_LABELS: Record<string, string> = {
  active:    "Active",
  completed: "Completed",
  paused:    "Paused",
  abandoned: "Abandoned",
}

interface GoalCardProps {
  goal: Goal
}

export default function GoalCard({ goal }: GoalCardProps) {
  const targetDate = goal.target_date
    ? new Date(goal.target_date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <Link href={`/goals/${goal.id}`} className="group block">
      <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {goal.title}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              STATUS_STYLES[goal.status] ?? STATUS_STYLES.abandoned,
            )}
          >
            {STATUS_LABELS[goal.status] ?? goal.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[goal.category] ?? goal.category}
          </span>
          {targetDate && (
            <span className="text-[11px] text-muted-foreground">
              Due {targetDate}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium text-foreground">
              {goal.progress_pct}%
            </span>
          </div>
          <GoalProgressBar value={goal.progress_pct} />
        </div>
      </div>
    </Link>
  )
}
