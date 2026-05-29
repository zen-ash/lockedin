import type { SharedProgressLog } from "@/types/app"

interface SharedProgressLogListProps {
  logs:       SharedProgressLog[]
  targetUnit: string | null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  })
}

export default function SharedProgressLogList({
  logs,
  targetUnit,
}: SharedProgressLogListProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No progress logged yet.</p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-4 py-3"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              +{log.value_added}
              {targetUnit && (
                <span className="ml-1 font-normal text-muted-foreground">
                  {targetUnit}
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(log.log_date)}
            </span>
          </div>
          {log.note ? (
            <p className="text-xs text-muted-foreground">{log.note}</p>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">Private note</p>
          )}
        </div>
      ))}
    </div>
  )
}
