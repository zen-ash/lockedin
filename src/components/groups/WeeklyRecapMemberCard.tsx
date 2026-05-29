import { cn } from "@/lib/utils"
import WeeklyRecapGoalCard from "./WeeklyRecapGoalCard"
import type { RecapTaskData } from "./WeeklyRecapGoalCard"

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecapMemberStatus = "completed_strong" | "in_progress" | "no_shared_goals"

export type RecapMember = {
  user_id: string
  role:    string
  profile: {
    id:         string
    username:   string | null
    full_name:  string | null
    avatar_url: string | null
  } | null
}

// ── Config ────────────────────────────────────────────────────────────────────

const MEMBER_STATUS_CONFIG: Record<RecapMemberStatus, { label: string; style: string }> = {
  completed_strong: {
    label: "Completed Strong",
    style: "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  in_progress: {
    label: "In Progress",
    style: "border-primary/30 bg-primary/10 text-primary",
  },
  no_shared_goals: {
    label: "No Shared Goals",
    style: "border-border bg-muted/50 text-muted-foreground",
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface WeeklyRecapMemberCardProps {
  member:          RecapMember
  tasks:           RecapTaskData[]
  currentUserId:   string
  sharedGoalCount: number
  avgProgress:     number
  avgRating:       number
  logCount:        number
  status:          RecapMemberStatus
}

export default function WeeklyRecapMemberCard({
  member,
  tasks,
  currentUserId,
  sharedGoalCount,
  avgProgress,
  avgRating,
  logCount,
  status,
}: WeeklyRecapMemberCardProps) {
  const profile       = member.profile
  const initials      = (profile?.full_name?.[0] ?? profile?.username?.[0] ?? "?").toUpperCase()
  const displayName   = profile?.full_name ?? profile?.username ?? "Unknown"
  const isCurrentUser = member.user_id === currentUserId
  const isMemberOwner = member.role === "owner"
  const statusCfg     = MEMBER_STATUS_CONFIG[status]

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      {/* Member header */}
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
        </div>

        {sharedGoalCount > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-foreground">{Math.round(avgProgress)}%</p>
            <p className="text-[10px] text-muted-foreground/60">
              {sharedGoalCount} {sharedGoalCount === 1 ? "goal" : "goals"}
              {logCount > 0 && ` · ${logCount} ${logCount === 1 ? "log" : "logs"}`}
            </p>
            {avgRating > 0 && (
              <p className="text-[10px] text-amber-500 dark:text-amber-400">★ {avgRating.toFixed(1)}</p>
            )}
          </div>
        )}
      </div>

      {/* Goal cards */}
      <div className="px-5 py-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No shared weekly goals this week.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {tasks.map((taskData) => (
              <WeeklyRecapGoalCard
                key={taskData.task.id}
                taskData={taskData}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
