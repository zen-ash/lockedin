import Link from "next/link"
import { cn } from "@/lib/utils"

interface WeeklyRecapHeaderProps {
  groupId:       string
  groupName:     string
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

export default function WeeklyRecapHeader({
  groupId,
  groupName,
  weekStartStr,
  weekRange,
  isCurrentWeek,
}: WeeklyRecapHeaderProps) {
  const prevWeek = offsetWeekStr(weekStartStr, -1)
  const nextWeek = offsetWeekStr(weekStartStr, +1)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/groups/${groupId}`}
          className="mb-1 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to group
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {groupName}
        </p>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Weekly Recap
        </h1>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
        <Link
          href={`/groups/${groupId}/recap?week=${prevWeek}`}
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
              href={`/groups/${groupId}/recap`}
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
          href={`/groups/${groupId}/recap?week=${nextWeek}`}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Next →
        </Link>
      </div>
    </div>
  )
}
