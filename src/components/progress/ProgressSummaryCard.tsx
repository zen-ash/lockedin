interface ProgressSummaryCardProps {
  currentValue: number
  targetValue:  number | null
  targetUnit:   string | null
  progressPct:  number
}

export default function ProgressSummaryCard({
  currentValue,
  targetValue,
  targetUnit,
  progressPct,
}: ProgressSummaryCardProps) {
  const displayPct = Math.min(100, Math.round(progressPct))

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-3 text-sm font-medium text-foreground">Progress</p>

      {targetValue != null && targetValue > 0 ? (
        <>
          <div className="mb-3 flex items-end gap-1.5">
            <span className="text-3xl font-bold text-foreground">
              {currentValue}
            </span>
            <span className="mb-1 text-sm text-muted-foreground">
              / {targetValue}
              {targetUnit ? ` ${targetUnit}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${displayPct}%` }}
                />
              </div>
            </div>
            <span className="text-xl font-bold text-foreground">
              {displayPct}%
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${displayPct}%` }}
              />
            </div>
          </div>
          <span className="text-xl font-bold text-foreground">
            {displayPct}%
          </span>
        </div>
      )}

      {targetValue == null && (
        <p className="mt-2 text-xs text-muted-foreground">
          Set a target value to enable quantitative progress tracking.
        </p>
      )}
    </div>
  )
}
