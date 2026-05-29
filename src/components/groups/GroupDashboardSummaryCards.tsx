interface GroupDashboardSummaryCardsProps {
  sharedGoalCount:    number
  groupCompletionPct: number
  ratingsGiven:       number
  ratingsExpected:    number
  activeMembers:      number
  totalMembers:       number
}

export default function GroupDashboardSummaryCards({
  sharedGoalCount,
  groupCompletionPct,
  ratingsGiven,
  ratingsExpected,
  activeMembers,
  totalMembers,
}: GroupDashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          Peer Reviews
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
    </div>
  )
}
