"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface WeekNavigatorProps {
  groupId:       string
  weekStartStr:  string
  weekRange:     string
  isCurrentWeek: boolean
}

function offsetWeekStr(weekStartStr: string, weeks: number): string {
  const date = new Date(weekStartStr + "T00:00:00Z")
  date.setUTCDate(date.getUTCDate() + weeks * 7)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function WeekNavigator({
  groupId,
  weekStartStr,
  weekRange,
  isCurrentWeek,
}: WeekNavigatorProps) {
  const prevWeek = offsetWeekStr(weekStartStr, -1)
  const nextWeek = offsetWeekStr(weekStartStr, +1)

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
      <Link
        href={`/groups/${groupId}?week=${prevWeek}`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Prev
      </Link>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{weekRange}</span>
        {isCurrentWeek ? (
          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            This week
          </span>
        ) : (
          <Link
            href={`/groups/${groupId}`}
            className={cn(
              "rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary",
              "transition-colors hover:bg-primary/20",
            )}
          >
            Current week
          </Link>
        )}
      </div>

      <Link
        href={`/groups/${groupId}?week=${nextWeek}`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Next →
      </Link>
    </div>
  )
}
