"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type {
  BlueprintDraft,
  BlueprintLongTermGoal,
  BlueprintMonthlyGoal,
  BlueprintWeeklyGoal,
} from "@/lib/utils/blueprint-types"
import { lockInBlueprint } from "@/lib/actions/blueprint"
import BlueprintMonthlyGoalCard from "@/components/blueprint/BlueprintMonthlyGoalCard"
import BlueprintWeeklyGoalCard from "@/components/blueprint/BlueprintWeeklyGoalCard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ── Field styles ──────────────────────────────────────────────────────────────

const F_INPUT =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const F_SELECT =
  "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const F_TEXTAREA =
  "min-h-[88px] w-full min-w-0 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const F_LABEL =
  "mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"

// ── Constants ─────────────────────────────────────────────────────────────────

const CONFIDENCE_LABELS: Record<string, string> = {
  low:    "Low confidence",
  medium: "Medium confidence",
  high:   "High confidence",
}

const CATEGORIES = [
  "Career",
  "Fitness",
  "Finance",
  "Learning",
  "Health",
  "Creative",
  "Personal",
] as const

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  blueprint: BlueprintDraft
  onChange:  React.Dispatch<React.SetStateAction<BlueprintDraft | null>>
}

export default function BlueprintReview({ blueprint, onChange }: Props) {
  const router                    = useRouter()
  const [isSaving, startSave]     = useTransition()

  // Functional update for a single long-term goal field.
  function updateLTG<K extends keyof BlueprintLongTermGoal>(
    key: K,
    value: BlueprintLongTermGoal[K],
  ) {
    onChange((prev) => {
      if (!prev) return prev
      return { ...prev, longTermGoal: { ...prev.longTermGoal, [key]: value } }
    })
  }

  // Functional update for one monthly goal by tempId.
  function handleMonthlyChange(updated: BlueprintMonthlyGoal) {
    onChange((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        monthlyGoals: prev.monthlyGoals.map((mg) =>
          mg.tempId === updated.tempId ? updated : mg,
        ),
      }
    })
  }

  // Functional update for one weekly goal by tempId.
  function handleWeeklyChange(updated: BlueprintWeeklyGoal) {
    onChange((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        weeklyGoals: prev.weeklyGoals.map((wg) =>
          wg.tempId === updated.tempId ? updated : wg,
        ),
      }
    })
  }

  function handleLockIn() {
    // Light client-side guards before hitting the server.
    if (!blueprint.longTermGoal.title.trim()) {
      toast.error("Add a title to your long-term goal before saving.")
      return
    }
    if (blueprint.monthlyGoals.length === 0) {
      toast.error("Add at least one monthly milestone before saving.")
      return
    }

    startSave(async () => {
      const result = await lockInBlueprint(blueprint)
      if (result.success) {
        toast.success("Blueprint saved.")
        router.push(`/goals/${result.goalId}`)
      } else {
        toast.error(result.error || "Could not save blueprint. Please try again.")
      }
    })
  }

  const ltg = blueprint.longTermGoal

  return (
    <div className="flex flex-col gap-6">

      {/* ── 1. Summary ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Blueprint Ready
          </p>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              blueprint.source === "ai"
                ? "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {blueprint.source === "ai" ? "AI-generated" : "Local starter blueprint"}
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {CONFIDENCE_LABELS[blueprint.confidence] ?? blueprint.confidence}
          </span>
        </div>
        <p className="text-sm text-foreground">{blueprint.summary}</p>
        {blueprint.assumptions && (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Assumptions:</span>{" "}
            {blueprint.assumptions}
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Review and edit your blueprint below, then save it into your goals.
        </p>
      </div>

      {/* ── 2. Long-term goal (editable) ─────────────────────────────────── */}
      <section aria-labelledby="review-ltg-heading">
        <p
          id="review-ltg-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Long-Term Goal
        </p>

        <div className="rounded-xl border border-border bg-card p-5">
          {/* Title */}
          <div>
            <label htmlFor="ltg-title" className={F_LABEL}>Title</label>
            <input
              id="ltg-title"
              type="text"
              value={ltg.title}
              onChange={(e) => updateLTG("title", e.target.value)}
              className={cn(F_INPUT, "font-serif text-base font-semibold")}
              placeholder="Long-term goal title"
              maxLength={300}
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div className="mt-3">
            <label htmlFor="ltg-desc" className={F_LABEL}>Description</label>
            <textarea
              id="ltg-desc"
              value={ltg.description}
              onChange={(e) => updateLTG("description", e.target.value)}
              className={F_TEXTAREA}
              placeholder="What does achieving this goal look like?"
              maxLength={2000}
              rows={3}
              disabled={isSaving}
            />
          </div>

          {/* Deadline + Category */}
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ltg-deadline" className={F_LABEL}>Deadline</label>
              <input
                id="ltg-deadline"
                type="date"
                value={ltg.deadline}
                onChange={(e) => updateLTG("deadline", e.target.value)}
                className={F_INPUT}
                disabled={isSaving}
              />
            </div>
            <div>
              <label htmlFor="ltg-category" className={F_LABEL}>
                Category{" "}
                <span className="normal-case font-normal text-muted-foreground/70">
                  (optional)
                </span>
              </label>
              <select
                id="ltg-category"
                value={ltg.category ?? ""}
                onChange={(e) =>
                  updateLTG("category", e.target.value || undefined)
                }
                className={F_SELECT}
                disabled={isSaving}
              >
                <option value="">— None —</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {/* Preserve unlisted category from AI */}
                {ltg.category &&
                  !(CATEGORIES as readonly string[]).includes(ltg.category) && (
                    <option value={ltg.category}>{ltg.category}</option>
                  )}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Monthly milestones ─────────────────────────────────────────── */}
      <section aria-labelledby="review-monthly-heading">
        <p
          id="review-monthly-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Monthly Milestones ({blueprint.monthlyGoals.length})
        </p>
        <div className="flex flex-col gap-3">
          {blueprint.monthlyGoals.map((mg) => (
            <BlueprintMonthlyGoalCard
              key={mg.tempId}
              goal={mg}
              onChange={handleMonthlyChange}
            />
          ))}
        </div>
      </section>

      {/* ── 4. Current week goals ─────────────────────────────────────────── */}
      <section aria-labelledby="review-weekly-heading">
        <p
          id="review-weekly-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground"
        >
          This Week ({blueprint.weeklyGoals.length})
        </p>
        <div className="flex flex-col gap-3">
          {blueprint.weeklyGoals.map((wg) => (
            <BlueprintWeeklyGoalCard
              key={wg.tempId}
              goal={wg}
              monthlyGoals={blueprint.monthlyGoals}
              onChange={handleWeeklyChange}
            />
          ))}
        </div>
      </section>

      {/* ── 5. Lock It In ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/20 p-6">
        <p className="mb-1 text-sm font-medium text-foreground">
          Ready to commit?
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Save this blueprint into your goals, monthly milestones, and this week&apos;s goals.
        </p>
        <Button
          type="button"
          disabled={isSaving}
          onClick={handleLockIn}
        >
          {isSaving ? "Saving…" : "Lock It In"}
        </Button>
      </div>

    </div>
  )
}
