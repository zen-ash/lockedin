export type WeightSuggestion = {
  weight:     1 | 2 | 3
  confidence: "low" | "medium" | "high"
  reasoning:  string
  source?:    "ai" | "heuristic"
}

export function getWeightLabel(weight: number): string {
  if (weight === 1) return "Supporting"
  if (weight === 2) return "Important"
  if (weight === 3) return "Critical"
  return "Custom Impact"
}

export function getWeightExplanation(weight: number): string {
  if (weight === 1) return "Helpful milestone that supports the larger goal."
  if (weight === 2) return "Meaningful work that contributes strongly to the larger goal."
  if (weight === 3) return "High-impact milestone that directly drives the larger goal."
  return "Custom impact level — stored as-is."
}

export function getWeightBadgeClasses(weight: number): string {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
  if (weight === 1)
    return `${base} bg-secondary text-secondary-foreground`
  if (weight === 2)
    return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`
  if (weight === 3)
    return `${base} bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300`
  return `${base} bg-secondary text-secondary-foreground`
}

// ── Heuristic helpers ─────────────────────────────────────────────────────────

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw))
}

interface HeuristicInput {
  title:               string
  description?:        string
  parentGoalTitle?:    string
  parentGoalCategory?: string
}

// ── Deterministic fallback ────────────────────────────────────────────────────
// Used when OPENAI_API_KEY is absent or the AI call fails.
// Uses transparent keyword rules so users can predict and verify the output.

export function suggestMonthlyGoalWeightHeuristic(
  input: HeuristicInput,
): WeightSuggestion {
  const text = [
    input.title,
    input.description ?? "",
    input.parentGoalTitle ?? "",
  ]
    .join(" ")
    .toLowerCase()

  const cat = (input.parentGoalCategory ?? "").toLowerCase()

  const isCareer =
    cat === "career" ||
    hasAny(text, ["job", "career", "internship", "hired", "hire", "recruiting"])

  const isFitness =
    cat === "fitness" ||
    hasAny(text, ["fitness", "gym", "workout", "health", "body weight"])

  const isFinance =
    cat === "finance" ||
    hasAny(text, ["money", "finance", "saving", "savings", "financial", "invest", "budget"])

  // ── Career domain ──────────────────────────────────────────────────────────
  if (isCareer) {
    if (
      hasAny(text, [
        "apply",
        "application",
        "interview",
        "recruiter",
        "referral",
        "networking",
        "portfolio",
        "resume",
        "linkedin",
        "outreach",
        "cold email",
        "reach out",
      ])
    ) {
      return {
        weight:     3,
        confidence: "medium",
        source:     "heuristic",
        reasoning:
          "Directly executing on your job search — applications and outreach drive hiring outcomes.",
      }
    }

    if (
      hasAny(text, [
        "leetcode",
        "dsa",
        "system design",
        "mock interview",
        "practice",
        "study",
        "build",
        "project",
      ])
    ) {
      return {
        weight:     2,
        confidence: "medium",
        source:     "heuristic",
        reasoning:
          "Skill-building that strengthens your candidacy but isn't the final outcome.",
      }
    }

    if (hasAny(text, ["watch", "video", "course", "read", "research", "plan", "organize"])) {
      return {
        weight:     1,
        confidence: "medium",
        source:     "heuristic",
        reasoning:
          "Passive learning — important groundwork but lower direct impact on hiring.",
      }
    }
  }

  // ── Fitness domain ─────────────────────────────────────────────────────────
  if (isFitness) {
    if (
      hasAny(text, [
        "workout",
        "exercise",
        "run",
        "lift",
        "calorie",
        "diet",
        "meal prep",
        "steps",
        "cardio",
        "strength",
        "training session",
      ])
    ) {
      return {
        weight:     3,
        confidence: "medium",
        source:     "heuristic",
        reasoning:
          "Physical execution directly drives fitness results.",
      }
    }

    if (hasAny(text, ["stretch", "mobility", "sleep", "track", "recovery"])) {
      return {
        weight:     2,
        confidence: "medium",
        source:     "heuristic",
        reasoning:
          "Recovery and tracking support your fitness progress.",
      }
    }

    if (hasAny(text, ["watch", "video", "research", "read", "plan"])) {
      return {
        weight:     1,
        confidence: "medium",
        source:     "heuristic",
        reasoning:
          "Passive learning — lower direct impact on fitness outcomes.",
      }
    }
  }

  // ── Finance domain ─────────────────────────────────────────────────────────
  if (isFinance) {
    if (hasAny(text, ["save", "earn", "budget", "pay off", "invest", "income", "deposit", "transfer"])) {
      return {
        weight:     3,
        confidence: "medium",
        source:     "heuristic",
        reasoning:
          "Direct financial action toward your savings or income goal.",
      }
    }

    if (hasAny(text, ["track expense", "review spending", "track", "audit", "categorize"])) {
      return {
        weight:     2,
        confidence: "medium",
        source:     "heuristic",
        reasoning:
          "Tracking spending builds awareness that supports your financial goal.",
      }
    }

    if (hasAny(text, ["research", "read", "watch", "learn", "study"])) {
      return {
        weight:     1,
        confidence: "medium",
        source:     "heuristic",
        reasoning:
          "Financial research is useful groundwork but lower direct impact.",
      }
    }
  }

  // ── General fallback by action type ───────────────────────────────────────
  if (
    hasAny(text, [
      "build",
      "ship",
      "launch",
      "deploy",
      "apply",
      "execute",
      "create",
      "complete",
      "finish",
      "submit",
      "deliver",
      "publish",
      "release",
    ])
  ) {
    return {
      weight:     3,
      confidence: "low",
      source:     "heuristic",
      reasoning:
        "Direct execution work — tangible output that moves the needle on your goal.",
    }
  }

  if (
    hasAny(text, [
      "practice",
      "learn",
      "improve",
      "develop",
      "train",
      "prepare",
      "study",
      "build skill",
      "grow",
    ])
  ) {
    return {
      weight:     2,
      confidence: "low",
      source:     "heuristic",
      reasoning:
        "Skill-building work — meaningful but not the direct final outcome.",
    }
  }

  // Safe default
  return {
    weight:     1,
    confidence: "low",
    source:     "heuristic",
    reasoning:
      "Using Supporting as a safe default — change to Important or Critical if this milestone directly drives your goal.",
  }
}
