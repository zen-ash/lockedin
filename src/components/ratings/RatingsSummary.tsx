interface RatingsSummaryProps {
  average: number
  count:   number
}

export default function RatingsSummary({ average, count }: RatingsSummaryProps) {
  if (count === 0) {
    return (
      <p className="text-sm text-muted-foreground">No ratings yet.</p>
    )
  }

  const filled = Math.round(average)

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= filled ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground/30"}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-sm font-medium text-foreground">
        {average.toFixed(1)}
      </span>
      <span className="text-xs text-muted-foreground">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  )
}
