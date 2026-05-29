import Link from "next/link"
import { cn } from "@/lib/utils"
import GoalProgressBar from "@/components/goals/GoalProgressBar"
import { MONTHLY_GOAL_STATUS_LABELS, MONTHLY_GOAL_CATEGORY_LABELS } from "@/lib/monthly-goals-schema"
import { formatMonthStart } from "@/lib/utils/week"
import type { MonthlyGoal } from "@/types/app"

const STATUS_STYLES: Record<string, string> = {
  active:    "border-primary/30 bg-primary/10 text-primary",
  completed: "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  paused:    "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  abandoned: "border-border bg-muted/50 text-muted-foreground",
}

interface MonthlyGoalCardProps {
  mg: MonthlyGoal
}

export default function MonthlyGoalCard({ mg }: MonthlyGoalCardProps) {
  return (
    <Link
      href={`/monthly-goals/${mg.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {mg.title}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            STATUS_STYLES[mg.status] ?? STATUS_STYLES.abandoned,
          )}
        >
          {MONTHLY_GOAL_STATUS_LABELS[mg.status] ?? mg.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
          {formatMonthStart(mg.month_start)}
        </span>
        {mg.category && (
          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {MONTHLY_GOAL_CATEGORY_LABELS[mg.category] ?? mg.category}
          </span>
        )}
        {mg.weight !== 1 && (
          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            weight {mg.weight}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-medium text-foreground">{mg.progress_pct}%</span>
        </div>
        <GoalProgressBar value={mg.progress_pct} />
      </div>
    </Link>
  )
}
