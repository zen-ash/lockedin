import type { WeeklyGoalRatingWithRater } from "@/types/app"

interface RatingsListProps {
  ratings: WeeklyGoalRatingWithRater[]
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  })
}

export default function RatingsList({ ratings }: RatingsListProps) {
  if (ratings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No reviews yet.</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {ratings.map((r) => {
        const handle = r.profiles?.username
          ? `@${r.profiles.username}`
          : (r.profiles?.full_name ?? "Unknown")
        return (
          <div
            key={r.id}
            className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= r.rating ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground/30"}
                    >
                      ★
                    </span>
                  ))}
                </span>
                <span className="text-sm font-medium text-foreground">{handle}</span>
              </div>
              <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
            </div>
            {r.comment && (
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
