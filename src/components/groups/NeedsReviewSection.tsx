import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type NeedsReviewTask = {
  id:            string
  title:         string
  progress:      number
  current_value: number
  target_value:  number | null
  target_unit:   string | null
  ownerHandle:   string
}

interface NeedsReviewSectionProps {
  tasks: NeedsReviewTask[]
}

export default function NeedsReviewSection({ tasks }: NeedsReviewSectionProps) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Needs Your Review
      </h2>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-sm text-muted-foreground">
            You&apos;re caught up on reviews.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => {
            const progressPct  = Math.min(100, Math.round(task.progress))
            const progressLabel =
              task.target_value != null && task.target_value > 0
                ? `${task.current_value} / ${task.target_value}${task.target_unit ? ` ${task.target_unit}` : ""}`
                : `${progressPct}%`

            return (
              <div
                key={task.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">
                    {task.ownerHandle}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{progressLabel}</p>
                </div>
                <Link
                  href={`/tasks/${task.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Review
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
