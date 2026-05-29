import Link from "next/link"
import { cn } from "@/lib/utils"
import { STATUS_LABELS } from "@/lib/tasks-schema"
import { formatMonthStart } from "@/lib/utils/week"
import type { SharedProgressLog } from "@/types/app"

// ── Local types ──────────────────────────────────────────────────────────────

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

export type DashboardTask = {
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

export type DashboardTaskData = {
  task:              DashboardTask
  sharedLogs:        SharedProgressLog[]
  avgRating:         number
  ratingCount:       number
  currentUserRating: { id: string; rating: number; comment: string | null } | null
}

export type DashboardMember = {
  user_id:  string
  role:     string
  profile: {
    id:         string
    username:   string | null
    full_name:  string | null
    avatar_url: string | null
  } | null
}

export type MemberStatus = "on_track" | "needs_attention" | "no_shared_goals"

interface MemberAccountabilityCardProps {
  member:          DashboardMember
  tasks:           DashboardTaskData[]
  currentUserId:   string
  sharedGoalCount: number
  avgProgress:     number
  lastLogDate:     string | null
  status:          MemberStatus
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:     "border-border bg-muted/50 text-muted-foreground",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  completed:   "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  missed:      "border-destructive/30 bg-destructive/10 text-destructive",
}

const MEMBER_STATUS_CONFIG: Record<MemberStatus, { label: string; style: string }> = {
  on_track:        { label: "On Track",        style: "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" },
  needs_attention: { label: "Needs Attention", style: "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" },
  no_shared_goals: { label: "No Shared Goals", style: "border-border bg-muted/50 text-muted-foreground" },
}

function formatLogDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MemberAccountabilityCard({
  member,
  tasks,
  currentUserId,
  sharedGoalCount,
  avgProgress,
  lastLogDate,
  status,
}: MemberAccountabilityCardProps) {
  const profile       = member.profile
  const initials      = (profile?.full_name?.[0] ?? profile?.username?.[0] ?? "?").toUpperCase()
  const displayName   = profile?.full_name ?? profile?.username ?? "Unknown"
  const isCurrentUser = member.user_id === currentUserId
  const isMemberOwner = member.role === "owner"
  const statusCfg     = MEMBER_STATUS_CONFIG[status]

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      {/* ── Member header ── */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {displayName}
              {isCurrentUser && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  (you)
                </span>
              )}
            </p>
            {isMemberOwner && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                Owner
              </span>
            )}
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                statusCfg.style,
              )}
            >
              {statusCfg.label}
            </span>
          </div>
          {profile?.username && (
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
          )}
          {lastLogDate && (
            <p className="text-[11px] text-muted-foreground/60">
              Last logged {formatLogDate(lastLogDate)}
            </p>
          )}
        </div>

        {sharedGoalCount > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {sharedGoalCount} {sharedGoalCount === 1 ? "goal" : "goals"}
            </p>
            <p className="text-lg font-bold text-foreground">{Math.round(avgProgress)}%</p>
            <p className="text-[10px] text-muted-foreground">avg</p>
          </div>
        )}
      </div>

      {/* ── Tasks ── */}
      <div className="px-5 py-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No shared weekly goals this week.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {tasks.map(({ task, sharedLogs, avgRating, ratingCount, currentUserRating }) => {
              const progressPct   = Math.min(100, Math.round(task.progress))
              const mg            = task.monthly_goals
              const effectiveGoal = (mg?.goals as ParentGoal | null) ?? (task.goals as ParentGoal | null)
              const isOwner       = task.user_id === currentUserId

              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/10 p-4"
                >
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
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                        {mg.title}
                      </p>
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

                  {/* Daily work */}
                  {sharedLogs.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                        Daily Work
                      </p>
                      <div className="flex flex-col gap-1">
                        {sharedLogs.slice(0, 3).map((log) => (
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
                              <p className="text-[11px] italic text-muted-foreground/40">
                                Private note
                              </p>
                            )}
                          </div>
                        ))}
                        {sharedLogs.length > 3 && (
                          <p className="text-[11px] text-muted-foreground/60">
                            +{sharedLogs.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rating summary + CTA */}
                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex items-center gap-1.5">
                      {ratingCount > 0 ? (
                        <>
                          <span className="text-amber-500 dark:text-amber-400">★</span>
                          <span className="text-xs font-medium text-foreground">
                            {avgRating.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ({ratingCount})
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          No reviews yet
                        </span>
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
            })}
          </div>
        )}
      </div>
    </div>
  )
}
