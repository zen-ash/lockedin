import DeleteProgressLogButton from "./DeleteProgressLogButton"
import type { DailyProgressLog } from "@/types/app"

type LogItem = DailyProgressLog & { is_note_shared?: boolean }

interface ProgressLogListProps {
  logs:       LogItem[]
  targetUnit: string | null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  })
}

export default function ProgressLogList({ logs, targetUnit }: ProgressLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-6 text-center">
        <p className="text-sm font-medium text-foreground">No entries yet.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Log your first daily progress using the form above.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
        >
          <div className="flex flex-col gap-0.5">
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
              {log.is_note_shared && (
                <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                  Shared note
                </span>
              )}
            </div>
            {log.note && (
              <p className="text-xs text-muted-foreground">{log.note}</p>
            )}
          </div>
          <DeleteProgressLogButton logId={log.id} />
        </div>
      ))}
    </div>
  )
}
