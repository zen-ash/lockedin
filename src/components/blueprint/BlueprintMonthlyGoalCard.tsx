"use client"

import type { BlueprintMonthlyGoal, ImpactLevel } from "@/lib/utils/blueprint-types"
import {
  getWeightLabel,
  getWeightExplanation,
  getWeightBadgeClasses,
} from "@/lib/utils/weight-suggestions"

// ── Shared field styles ───────────────────────────────────────────────────────

const F_INPUT =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const F_SELECT =
  "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const F_TEXTAREA =
  "w-full min-w-0 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const F_LABEL =
  "mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"

// ── Constants ─────────────────────────────────────────────────────────────────

const IMPACT_OPTIONS: { value: ImpactLevel; label: string }[] = [
  { value: "supporting", label: "Supporting" },
  { value: "important",  label: "Important"  },
  { value: "critical",   label: "Critical"   },
]

const IMPACT_TO_WEIGHT: Record<ImpactLevel, 1 | 2 | 3> = {
  supporting: 1,
  important:  2,
  critical:   3,
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  goal:     BlueprintMonthlyGoal
  onChange: (next: BlueprintMonthlyGoal) => void
}

export default function BlueprintMonthlyGoalCard({ goal, onChange }: Props) {
  const id = goal.tempId

  function set<K extends keyof BlueprintMonthlyGoal>(
    key: K,
    value: BlueprintMonthlyGoal[K],
  ) {
    onChange({ ...goal, [key]: value })
  }

  function handleImpact(impact: ImpactLevel) {
    onChange({ ...goal, impactLevel: impact, weight: IMPACT_TO_WEIGHT[impact] })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">

      {/* Title + Impact select */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <label htmlFor={`mg-${id}-title`} className={F_LABEL}>
            Title
          </label>
          <input
            id={`mg-${id}-title`}
            type="text"
            value={goal.title}
            onChange={(e) => set("title", e.target.value)}
            className={F_INPUT}
            placeholder="Monthly milestone title"
            maxLength={300}
          />
        </div>
        <div className="sm:w-40 sm:shrink-0">
          <label htmlFor={`mg-${id}-impact`} className={F_LABEL}>
            Impact
          </label>
          <select
            id={`mg-${id}-impact`}
            value={goal.impactLevel}
            onChange={(e) => handleImpact(e.target.value as ImpactLevel)}
            className={F_SELECT}
          >
            {IMPACT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Impact badge + explanation */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={getWeightBadgeClasses(goal.weight)}>
          {getWeightLabel(goal.weight)}
        </span>
        <span className="text-xs text-muted-foreground">
          {getWeightExplanation(goal.weight)}
        </span>
      </div>

      {/* Description */}
      <div className="mt-3">
        <label htmlFor={`mg-${id}-desc`} className={F_LABEL}>
          Description
        </label>
        <textarea
          id={`mg-${id}-desc`}
          value={goal.description}
          onChange={(e) => set("description", e.target.value)}
          className={F_TEXTAREA}
          placeholder="What does success look like this month?"
          maxLength={1000}
          rows={2}
        />
      </div>

      {/* Month + Target value + Target unit */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={`mg-${id}-month`} className={F_LABEL}>
            Month
          </label>
          <input
            id={`mg-${id}-month`}
            type="month"
            value={goal.month_start.slice(0, 7)}
            onChange={(e) =>
              set(
                "month_start",
                e.target.value ? `${e.target.value}-01` : goal.month_start,
              )
            }
            className={F_INPUT}
          />
        </div>
        <div>
          <label htmlFor={`mg-${id}-target`} className={F_LABEL}>
            Target
          </label>
          <input
            id={`mg-${id}-target`}
            type="number"
            min={0}
            step="any"
            value={goal.target_value !== undefined ? String(goal.target_value) : ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              set("target_value", isNaN(v) ? undefined : v)
            }}
            className={F_INPUT}
            placeholder="e.g. 20"
          />
        </div>
        <div>
          <label htmlFor={`mg-${id}-unit`} className={F_LABEL}>
            Unit
          </label>
          <input
            id={`mg-${id}-unit`}
            type="text"
            value={goal.target_unit ?? ""}
            onChange={(e) => set("target_unit", e.target.value || undefined)}
            className={F_INPUT}
            placeholder="e.g. apps"
            maxLength={50}
          />
        </div>
      </div>

      {/* Reasoning */}
      <div className="mt-3">
        <label htmlFor={`mg-${id}-reasoning`} className={F_LABEL}>
          Reasoning
        </label>
        <textarea
          id={`mg-${id}-reasoning`}
          value={goal.reasoning}
          onChange={(e) => set("reasoning", e.target.value)}
          className={F_TEXTAREA}
          placeholder="Why is this milestone here?"
          maxLength={300}
          rows={1}
        />
      </div>

    </div>
  )
}
