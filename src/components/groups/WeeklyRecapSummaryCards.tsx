interface WeeklyRecapSummaryCardsProps {
  sharedGoalCount:    number
  groupCompletionPct: number
  loggedWorkCount:    number
  ratingsGiven:       number
  ratingsExpected:    number
  activeMembers:      number
  totalMembers:       number
}

export default function WeeklyRecapSummaryCards({
  sharedGoalCount,
  groupCompletionPct,
  loggedWorkCount,
  ratingsGiven,
  ratingsExpected,
  activeMembers,
  totalMembers,
}: WeeklyRecapSummaryCardsProps) {
  const missingReviews = Math.max(0, ratingsExpected - ratingsGiven)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Shared Goals
        </p>
        <p className="text-2xl font-bold text-foreground">{sharedGoalCount}</p>
        <p className="text-xs text-muted-foreground">this week</p>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Group Completion
        </p>
        <p className="text-2xl font-bold text-foreground">{groupCompletionPct}%</p>
        <p className="text-xs text-muted-foreground">avg progress</p>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Logged Work
        </p>
        <p className="text-2xl font-bold text-foreground">{loggedWorkCount}</p>
        <p className="text-xs text-muted-foreground">
          {loggedWorkCount === 1 ? "entry" : "entries"}
        </p>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Reviews Submitted
        </p>
        <p className="text-2xl font-bold text-foreground">
          {ratingsGiven}
          <span className="ml-1 text-base font-normal text-muted-foreground">
            / {ratingsExpected}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">of expected</p>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Active Members
        </p>
        <p className="text-2xl font-bold text-foreground">
          {activeMembers}
          <span className="ml-1 text-base font-normal text-muted-foreground">
            / {totalMembers}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">shared or logged</p>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Missing Reviews
        </p>
        <p
          className={`text-2xl font-bold ${missingReviews > 0 ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}
        >
          {missingReviews}
        </p>
        <p className="text-xs text-muted-foreground">not yet submitted</p>
      </div>
    </div>
  )
}
