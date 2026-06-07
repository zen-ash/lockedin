"use client"

import type { BlueprintWeeklyGoal, BlueprintMonthlyGoal } from "@/lib/utils/blueprint-types"

// ── Shared field styles ───────────────────────────────────────────────────────

const F_INPUT =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const F_SELECT =
  "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const F_TEXTAREA =
  "w-full min-w-0 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const F_LABEL =
  "mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  goal:         BlueprintWeeklyGoal
  monthlyGoals: BlueprintMonthlyGoal[]
  onChange:     (next: BlueprintWeeklyGoal) => void
}

export default function BlueprintWeeklyGoalCard({
  goal,
  monthlyGoals,
  onChange,
}: Props) {
  const id = goal.tempId

  // If monthlyTempId is stale/invalid, fall back to first available for display.
  const displayTempId = monthlyGoals.some((mg) => mg.tempId === goal.monthlyTempId)
    ? goal.monthlyTempId
    : (monthlyGoals[0]?.tempId ?? goal.monthlyTempId)

  const linked = monthlyGoals.find((mg) => mg.tempId === displayTempId)

  function set<K extends keyof BlueprintWeeklyGoal>(
    key: K,
    value: BlueprintWeeklyGoal[K],
  ) {
    onChange({ ...goal, [key]: value })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">

      {/* Title + Linked milestone select */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <label htmlFor={`wg-${id}-title`} className={F_LABEL}>
            Title
          </label>
          <input
            id={`wg-${id}-title`}
            type="text"
            value={goal.title}
            onChange={(e) => set("title", e.target.value)}
            className={F_INPUT}
            placeholder="Weekly goal title"
            maxLength={300}
          />
        </div>
        <div className="sm:w-56 sm:shrink-0">
          <label htmlFor={`wg-${id}-monthly`} className={F_LABEL}>
            Linked Milestone
          </label>
          <select
            id={`wg-${id}-monthly`}
            value={displayTempId}
            onChange={(e) => set("monthlyTempId", e.target.value)}
            className={F_SELECT}
          >
            {monthlyGoals.map((mg) => (
              <option key={mg.tempId} value={mg.tempId}>
                {mg.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Linked label */}
      {linked && (
        <div className="mt-1.5">
          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            ↳ {linked.title}
          </span>
        </div>
      )}

      {/* Description */}
      <div className="mt-3">
        <label htmlFor={`wg-${id}-desc`} className={F_LABEL}>
          Description
        </label>
        <textarea
          id={`wg-${id}-desc`}
          value={goal.description}
          onChange={(e) => set("description", e.target.value)}
          className={F_TEXTAREA}
          placeholder="What does success look like this week?"
          maxLength={1000}
          rows={2}
        />
      </div>

      {/* Week start + Target value + Target unit */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={`wg-${id}-week`} className={F_LABEL}>
            Week of
          </label>
          <input
            id={`wg-${id}-week`}
            type="date"
            value={goal.week_start}
            onChange={(e) => set("week_start", e.target.value)}
            className={F_INPUT}
          />
        </div>
        <div>
          <label htmlFor={`wg-${id}-target`} className={F_LABEL}>
            Target
          </label>
          <input
            id={`wg-${id}-target`}
            type="number"
            min={0}
            step="any"
            value={goal.target_value !== undefined ? String(goal.target_value) : ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              set("target_value", isNaN(v) ? undefined : v)
            }}
            className={F_INPUT}
            placeholder="e.g. 10"
          />
        </div>
        <div>
          <label htmlFor={`wg-${id}-unit`} className={F_LABEL}>
            Unit
          </label>
          <input
            id={`wg-${id}-unit`}
            type="text"
            value={goal.target_unit ?? ""}
            onChange={(e) => set("target_unit", e.target.value || undefined)}
            className={F_INPUT}
            placeholder="e.g. PRs"
            maxLength={50}
          />
        </div>
      </div>

      {/* Reasoning */}
      <div className="mt-3">
        <label htmlFor={`wg-${id}-reasoning`} className={F_LABEL}>
          Reasoning
        </label>
        <textarea
          id={`wg-${id}-reasoning`}
          value={goal.reasoning}
          onChange={(e) => set("reasoning", e.target.value)}
          className={F_TEXTAREA}
          placeholder="Why this goal for this week?"
          maxLength={300}
          rows={1}
        />
      </div>

    </div>
  )
}
