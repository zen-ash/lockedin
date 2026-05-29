import Link from "next/link"
import { cn } from "@/lib/utils"
import { STATUS_LABELS } from "@/lib/tasks-schema"
import { formatMonthStart } from "@/lib/utils/week"
import type { SharedProgressLog } from "@/types/app"

// ── Types ─────────────────────────────────────────────────────────────────────

type ParentGoal = {
  id:           string
  title:        string
  progress_pct: number
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

export type RecapTask = {
  id:            string
  user_id:       string
  title:         string
  description:   string | null
  status:        string
  progress:      number
  current_value: number
  target_value:  number | null
  target_unit:   string | null
  week_start:    string
  monthly_goals: ParentMonthlyGoal | null
  goals:         ParentGoal | null
}

export type RecapTaskData = {
  task:              RecapTask
  sharedLogs:        SharedProgressLog[]
  avgRating:         number
  ratingCount:       number
  currentUserRating: { id: string; rating: number; comment: string | null } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:     "border-border bg-muted/50 text-muted-foreground",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  completed:   "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  missed:      "border-destructive/30 bg-destructive/10 text-destructive",
}

function formatLogDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface WeeklyRecapGoalCardProps {
  taskData:      RecapTaskData
  currentUserId: string
}

export default function WeeklyRecapGoalCard({
  taskData,
  currentUserId,
}: WeeklyRecapGoalCardProps) {
  const { task, sharedLogs, avgRating, ratingCount, currentUserRating } = taskData
  const progressPct   = Math.min(100, Math.round(task.progress))
  const mg            = task.monthly_goals
  const effectiveGoal = (mg?.goals as ParentGoal | null) ?? (task.goals as ParentGoal | null)
  const isOwner       = task.user_id === currentUserId

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/10 p-4">
      {/* Long-term goal */}
      {effectiveGoal && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Long-Term Goal
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {effectiveGoal.title}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/50 transition-all"
                style={{ width: `${effectiveGoal.progress_pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground/60">
              {effectiveGoal.progress_pct}%
            </span>
          </div>
        </div>
      )}

      {/* Monthly goal */}
      {mg && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Monthly Goal · {formatMonthStart(mg.month_start)}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{mg.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/60 transition-all"
                style={{ width: `${mg.progress_pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground/60">
              {mg.progress_pct}%
            </span>
          </div>
        </div>
      )}

      {/* Weekly goal */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Weekly Goal
            </p>
            <Link
              href={`/tasks/${task.id}`}
              className="mt-0.5 line-clamp-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              {task.title}
            </Link>
            {task.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {task.description}
              </p>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              STATUS_STYLES[task.status] ?? STATUS_STYLES.pending,
            )}
          >
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-medium text-foreground">
            {task.target_value != null && task.target_value > 0
              ? `${task.current_value} / ${task.target_value}${task.target_unit ? ` ${task.target_unit}` : ""}`
              : `${progressPct}%`}
          </span>
        </div>
      </div>

      {/* Logged work */}
      {sharedLogs.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Logged Work
          </p>
          <div className="flex flex-col gap-1">
            {sharedLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-0.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    +{log.value_added}
                    {task.target_unit && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        {task.target_unit}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatLogDate(log.log_date)}
                  </span>
                </div>
                {log.note ? (
                  <p className="text-[11px] text-muted-foreground">{log.note}</p>
                ) : (
                  <p className="text-[11px] italic text-muted-foreground/40">Private note</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peer reviews + CTA */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center gap-1.5">
          {ratingCount > 0 ? (
            <>
              <span className="text-amber-500 dark:text-amber-400">★</span>
              <span className="text-xs font-medium text-foreground">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-[11px] text-muted-foreground">({ratingCount})</span>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">No reviews yet</span>
          )}
          {currentUserRating && (
            <span className="text-[11px] text-muted-foreground/60">
              · You: {currentUserRating.rating}★
            </span>
          )}
        </div>
        <Link
          href={`/tasks/${task.id}`}
          className="text-xs text-primary transition-colors hover:text-primary/80"
        >
          {isOwner
            ? "View →"
            : currentUserRating
              ? "Update rating →"
              : "Review →"}
        </Link>
      </div>
    </div>
  )
}
