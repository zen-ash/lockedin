import type {
  BlueprintInput,
  BlueprintDraft,
  BlueprintLongTermGoal,
  BlueprintMonthlyGoal,
  BlueprintWeeklyGoal,
} from "./blueprint-types"

// ── Date utilities ────────────────────────────────────────────────────────────

// Returns the ISO date string of the Monday of the week containing dateStr.
// Parses as UTC noon to avoid DST / timezone boundary issues.
function getMondayOfWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  const dow = d.getUTCDay() // 0 = Sun, 1 = Mon, …, 6 = Sat
  const toMonday = dow === 0 ? -6 : 1 - dow
  d.setUTCDate(d.getUTCDate() + toMonday)
  return d.toISOString().split("T")[0]
}

// Returns "YYYY-MM-01" from any YYYY-MM-DD string.
function getMonthStart(dateStr: string): string {
  const [y, m] = dateStr.split("-")
  return `${y}-${m}-01`
}

// Adds n months to a "YYYY-MM-01" string and returns a new "YYYY-MM-01" string.
function addMonths(monthStart: string, n: number): string {
  const [y, m] = monthStart.split("-").map(Number)
  const total = y * 12 + (m - 1) + n
  const ny    = Math.floor(total / 12)
  const nm    = (total % 12) + 1
  return `${ny}-${String(nm).padStart(2, "0")}-01`
}

// Returns the number of whole months from one "YYYY-MM-01" to another.
function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number)
  const [ty, tm] = to.split("-").map(Number)
  return (ty - fy) * 12 + (tm - fm)
}

// Maps a fraction of the total timeline to a month offset, clamped to [0, totalMonths].
// When totalMonths = 0 every offset is 0, so all monthly goals land in the current month.
function off(totalMonths: number, fraction: number): number {
  return Math.min(totalMonths, Math.max(0, Math.round(totalMonths * fraction)))
}

// ── Domain detection ──────────────────────────────────────────────────────────

function hasAny(text: string, kws: readonly string[]): boolean {
  return kws.some((kw) => text.includes(kw))
}

function domainText(input: BlueprintInput): string {
  return [input.goalTitle, input.goalDescription ?? "", input.category ?? ""]
    .join(" ")
    .toLowerCase()
}

function isCareerGoal(input: BlueprintInput): boolean {
  if (input.category === "career") return true
  return hasAny(domainText(input), [
    "intern", "internship", "job", "career", "hired", "hire",
    "swe", "software engineer", "engineer", "developer", "recruiting",
    "offer", "full-time", "full time",
  ])
}

function isFitnessGoal(input: BlueprintInput): boolean {
  if (input.category === "fitness") return true
  return hasAny(domainText(input), [
    "fitness", "gym", "workout", "marathon", "run", "muscle",
    "weight loss", "body weight", "strength", "cardio", "lean", "bulk",
  ])
}

function isFinanceGoal(input: BlueprintInput): boolean {
  if (input.category === "finance") return true
  return hasAny(domainText(input), [
    "save", "saving", "savings", "invest", "money", "finance",
    "financial", "budget", "debt", "emergency fund", "retire", "wealth",
  ])
}

// ── Career blueprint ──────────────────────────────────────────────────────────

function buildCareerBlueprint(
  input: BlueprintInput,
  currentDate: string,
): { longTermGoal: BlueprintLongTermGoal; monthlyGoals: BlueprintMonthlyGoal[]; weeklyGoals: BlueprintWeeklyGoal[] } {
  const cm    = getMonthStart(currentDate)
  const dm    = getMonthStart(input.deadline)
  const total = Math.max(0, monthDiff(cm, dm))
  const scale = Math.max(0.2, Math.min(5, input.weeklyAvailabilityHours / 15))
  const ws    = getMondayOfWeek(currentDate)

  const longTermGoal: BlueprintLongTermGoal = {
    title:       input.goalTitle,
    description: input.goalDescription ??
      `Land a competitive internship or role by ${input.deadline} through consistent applications, technical preparation, and networking.`,
    deadline: input.deadline,
    category: input.category ?? "career",
  }

  const monthlyGoals: BlueprintMonthlyGoal[] = [
    {
      tempId:       "monthly_1",
      title:        "Resume + LinkedIn Polish",
      description:  "Finalize resume, update LinkedIn, and build a strong first impression for recruiters.",
      month_start:  addMonths(cm, off(total, 0)),
      target_value: 1,
      target_unit:  "polished resume",
      impactLevel:  "important",
      weight:       2,
      reasoning:    "Every application depends on a strong resume — this is the foundation.",
    },
    {
      tempId:       "monthly_2",
      title:        "Applications Wave 1",
      description:  "Send the first round of applications and reach out to recruiters proactively.",
      month_start:  addMonths(cm, off(total, 0.2)),
      target_value: Math.max(15, Math.round(40 * scale)),
      target_unit:  "applications",
      impactLevel:  "critical",
      weight:       3,
      reasoning:    "Application volume is the single highest-leverage activity for landing an internship.",
    },
    {
      tempId:       "monthly_3",
      title:        "DSA + Interview Prep",
      description:  "Consistent LeetCode practice and mock interviews to sharpen technical interview performance.",
      month_start:  addMonths(cm, off(total, 0.4)),
      target_value: Math.max(20, Math.round(60 * scale)),
      target_unit:  "LeetCode problems",
      impactLevel:  "important",
      weight:       2,
      reasoning:    "Technical interviews are a gatekeeper — strong DSA skills increase conversion from screen to offer.",
    },
    {
      tempId:       "monthly_4",
      title:        "Networking + Outreach",
      description:  "Send cold messages, attend events, and build relationships inside target companies.",
      month_start:  addMonths(cm, off(total, 0.6)),
      target_value: Math.max(10, Math.round(30 * scale)),
      target_unit:  "recruiter or engineer contacts",
      impactLevel:  "critical",
      weight:       3,
      reasoning:    "Referrals and warm intros dramatically improve interview conversion rates.",
    },
    {
      tempId:       "monthly_5",
      title:        "Portfolio Project",
      description:  "Build or polish a project that demonstrates relevant skills beyond LeetCode scores.",
      month_start:  addMonths(cm, off(total, 0.75)),
      target_value: 1,
      target_unit:  "shipped project",
      impactLevel:  "important",
      weight:       2,
      reasoning:    "A strong project demonstrates real-world execution ability to interviewers.",
    },
  ]

  const appsPerWeek    = Math.max(3, Math.round(5 * scale))
  const lcPerWeek      = Math.max(3, Math.round(10 * scale))
  const networkPerWeek = Math.max(2, Math.round(8 * scale))

  const weeklyGoals: BlueprintWeeklyGoal[] = [
    {
      tempId:        "weekly_1",
      monthlyTempId: "monthly_2",
      title:         `Apply to ${appsPerWeek} internship positions`,
      description:   "Prioritize roles at target companies that match your tech stack.",
      week_start:    ws,
      target_value:  appsPerWeek,
      target_unit:   "applications",
      reasoning:     "Applications are the top-of-funnel — volume this week sets up interviews next month.",
    },
    {
      tempId:        "weekly_2",
      monthlyTempId: "monthly_3",
      title:         `Solve ${lcPerWeek} LeetCode problems`,
      description:   "Focus on arrays, strings, and hash maps — the most common interview topics.",
      week_start:    ws,
      target_value:  lcPerWeek,
      target_unit:   "problems",
      reasoning:     "Consistent DSA practice now builds the fluency needed for technical screens.",
    },
    {
      tempId:        "weekly_3",
      monthlyTempId: "monthly_4",
      title:         `Send ${networkPerWeek} networking messages`,
      description:   "Cold outreach to engineers and recruiters at target companies via LinkedIn.",
      week_start:    ws,
      target_value:  networkPerWeek,
      target_unit:   "messages",
      reasoning:     "Building relationships early increases the chance of referrals before deadlines.",
    },
  ]

  return { longTermGoal, monthlyGoals, weeklyGoals }
}

// ── Fitness blueprint ─────────────────────────────────────────────────────────

function buildFitnessBlueprint(
  input: BlueprintInput,
  currentDate: string,
): { longTermGoal: BlueprintLongTermGoal; monthlyGoals: BlueprintMonthlyGoal[]; weeklyGoals: BlueprintWeeklyGoal[] } {
  const cm    = getMonthStart(currentDate)
  const dm    = getMonthStart(input.deadline)
  const total = Math.max(0, monthDiff(cm, dm))
  const scale = Math.max(0.2, Math.min(3, input.weeklyAvailabilityHours / 10))
  const ws    = getMondayOfWeek(currentDate)

  const longTermGoal: BlueprintLongTermGoal = {
    title:       input.goalTitle,
    description: input.goalDescription ??
      `Achieve the fitness target by ${input.deadline} through consistent training, nutrition, and recovery.`,
    deadline: input.deadline,
    category: input.category ?? "fitness",
  }

  const workoutsPerWeek  = Math.max(2, Math.min(6, Math.round(4 * scale)))
  const workoutsPerMonth = workoutsPerWeek * 4

  const monthlyGoals: BlueprintMonthlyGoal[] = [
    {
      tempId:       "monthly_1",
      title:        "Consistent Training Habit",
      description:  `Complete ${workoutsPerMonth} workouts this month and build an unbreakable training routine.`,
      month_start:  addMonths(cm, off(total, 0)),
      target_value: workoutsPerMonth,
      target_unit:  "workouts",
      impactLevel:  "critical",
      weight:       3,
      reasoning:    "Showing up consistently is the single highest-leverage fitness action.",
    },
    {
      tempId:       "monthly_2",
      title:        "Nutrition + Recovery",
      description:  "Track meals and prioritize sleep to support training adaptation.",
      month_start:  addMonths(cm, off(total, 0.3)),
      target_value: Math.round(20 * Math.min(1.5, scale)),
      target_unit:  "days tracked",
      impactLevel:  "important",
      weight:       2,
      reasoning:    "Nutrition and recovery determine 50%+ of fitness results regardless of training volume.",
    },
    {
      tempId:       "monthly_3",
      title:        "Progressive Overload",
      description:  "Increase training intensity, weight, or volume each week to force continued adaptation.",
      month_start:  addMonths(cm, off(total, 0.55)),
      target_value: workoutsPerMonth + 2,
      target_unit:  "workouts",
      impactLevel:  "critical",
      weight:       3,
      reasoning:    "Progressive overload is the mechanism of fitness improvement — static training stalls.",
    },
    {
      tempId:       "monthly_4",
      title:        "Performance Benchmark",
      description:  "Track key metrics — weight, reps, pace — to measure progress toward the goal.",
      month_start:  addMonths(cm, off(total, 0.8)),
      target_value: 1,
      target_unit:  "benchmark test",
      impactLevel:  "supporting",
      weight:       1,
      reasoning:    "Measuring progress keeps training calibrated to the end goal.",
    },
  ]

  const weeklyGoals: BlueprintWeeklyGoal[] = [
    {
      tempId:        "weekly_1",
      monthlyTempId: "monthly_1",
      title:         `Complete ${workoutsPerWeek} workouts`,
      description:   "Show up for every scheduled session this week — no exceptions.",
      week_start:    ws,
      target_value:  workoutsPerWeek,
      target_unit:   "workouts",
      reasoning:     "Consistency this week establishes the weekly training habit.",
    },
    {
      tempId:        "weekly_2",
      monthlyTempId: "monthly_2",
      title:         "Track nutrition for 5 days",
      description:   "Log meals for at least 5 days to build dietary awareness.",
      week_start:    ws,
      target_value:  5,
      target_unit:   "days tracked",
      reasoning:     "Tracking reveals the gap between current habits and the target — visibility drives change.",
    },
  ]

  return { longTermGoal, monthlyGoals, weeklyGoals }
}

// ── Finance blueprint ─────────────────────────────────────────────────────────

function buildFinanceBlueprint(
  input: BlueprintInput,
  currentDate: string,
): { longTermGoal: BlueprintLongTermGoal; monthlyGoals: BlueprintMonthlyGoal[]; weeklyGoals: BlueprintWeeklyGoal[] } {
  const cm    = getMonthStart(currentDate)
  const dm    = getMonthStart(input.deadline)
  const total = Math.max(0, monthDiff(cm, dm))
  const ws    = getMondayOfWeek(currentDate)

  const monthlySavings = Math.round(300 * Math.min(4, input.weeklyAvailabilityHours / 10))

  const longTermGoal: BlueprintLongTermGoal = {
    title:       input.goalTitle,
    description: input.goalDescription ??
      `Reach the financial target by ${input.deadline} through disciplined saving, spending awareness, and consistent action.`,
    deadline: input.deadline,
    category: input.category ?? "finance",
  }

  const monthlyGoals: BlueprintMonthlyGoal[] = [
    {
      tempId:       "monthly_1",
      title:        "Budget + Expense Audit",
      description:  "Track every expense this month to understand the current spending baseline.",
      month_start:  addMonths(cm, off(total, 0)),
      target_value: 30,
      target_unit:  "days tracked",
      impactLevel:  "important",
      weight:       2,
      reasoning:    "You can't improve what you don't measure — a full month of tracking reveals where money goes.",
    },
    {
      tempId:       "monthly_2",
      title:        `Save $${monthlySavings}`,
      description:  `Transfer $${monthlySavings} to savings or investment account this month.`,
      month_start:  addMonths(cm, off(total, 0.25)),
      target_value: monthlySavings,
      target_unit:  "dollars saved",
      impactLevel:  "critical",
      weight:       3,
      reasoning:    "Direct saving is the highest-impact financial action — what moves to savings gets saved.",
    },
    {
      tempId:       "monthly_3",
      title:        "Cut + Optimize Spending",
      description:  "Identify and eliminate at least 2 recurring expenses that don't align with the financial goal.",
      month_start:  addMonths(cm, off(total, 0.5)),
      target_value: 2,
      target_unit:  "expenses cut",
      impactLevel:  "supporting",
      weight:       1,
      reasoning:    "Spending optimization compounds over time and creates room for higher savings rates.",
    },
    {
      tempId:       "monthly_4",
      title:        "Review + Rebalance",
      description:  "Review progress and adjust the monthly savings rate based on actual income and expenses.",
      month_start:  addMonths(cm, off(total, 0.8)),
      target_value: 1,
      target_unit:  "financial review",
      impactLevel:  "important",
      weight:       2,
      reasoning:    "Mid-course corrections keep the plan realistic as circumstances change.",
    },
  ]

  const weeklyTransfer = Math.round(monthlySavings / 4)

  const weeklyGoals: BlueprintWeeklyGoal[] = [
    {
      tempId:        "weekly_1",
      monthlyTempId: "monthly_1",
      title:         "Track all expenses for 7 days",
      description:   "Log every purchase — no exceptions, including small ones.",
      week_start:    ws,
      target_value:  7,
      target_unit:   "days tracked",
      reasoning:     "A full week of tracking reveals spending patterns and surfaces easy wins.",
    },
    {
      tempId:        "weekly_2",
      monthlyTempId: "monthly_2",
      title:         `Transfer $${weeklyTransfer} to savings`,
      description:   "Move money to savings before spending on discretionary items.",
      week_start:    ws,
      target_value:  weeklyTransfer,
      target_unit:   "dollars",
      reasoning:     "Pay yourself first — transfers before spending make saving automatic.",
    },
  ]

  return { longTermGoal, monthlyGoals, weeklyGoals }
}

// ── General blueprint ─────────────────────────────────────────────────────────

function buildGeneralBlueprint(
  input: BlueprintInput,
  currentDate: string,
): { longTermGoal: BlueprintLongTermGoal; monthlyGoals: BlueprintMonthlyGoal[]; weeklyGoals: BlueprintWeeklyGoal[] } {
  const cm    = getMonthStart(currentDate)
  const dm    = getMonthStart(input.deadline)
  const total = Math.max(0, monthDiff(cm, dm))
  const ws    = getMondayOfWeek(currentDate)

  const hoursPerMonth = Math.round(input.weeklyAvailabilityHours * 4)

  const longTermGoal: BlueprintLongTermGoal = {
    title:       input.goalTitle,
    description: input.goalDescription ??
      `Achieve "${input.goalTitle}" by ${input.deadline} through consistent, deliberate execution.`,
    deadline: input.deadline,
    category: input.category,
  }

  const monthlyGoals: BlueprintMonthlyGoal[] = [
    {
      tempId:       "monthly_1",
      title:        "Foundation + Setup",
      description:  `Research, plan, and prepare everything needed to execute toward "${input.goalTitle}".`,
      month_start:  addMonths(cm, off(total, 0)),
      target_value: Math.max(4, Math.round(hoursPerMonth * 0.25)),
      target_unit:  "hours",
      impactLevel:  "supporting",
      weight:       1,
      reasoning:    "Upfront planning prevents wasted effort — capped at 25% of available time.",
    },
    {
      tempId:       "monthly_2",
      title:        "Core Execution — Phase 1",
      description:  "Do the work. Prioritize measurable output over planning or learning.",
      month_start:  addMonths(cm, off(total, 0.25)),
      target_value: Math.max(8, Math.round(hoursPerMonth * 0.8)),
      target_unit:  "hours",
      impactLevel:  "critical",
      weight:       3,
      reasoning:    "Direct execution toward the goal outcome is the highest-impact activity.",
    },
    {
      tempId:       "monthly_3",
      title:        "Review + Course Correct",
      description:  "Evaluate what's working, cut what isn't, and adjust the approach.",
      month_start:  addMonths(cm, off(total, 0.55)),
      target_value: 1,
      target_unit:  "review session",
      impactLevel:  "important",
      weight:       2,
      reasoning:    "Mid-course corrections prevent compounding on the wrong approach.",
    },
    {
      tempId:       "monthly_4",
      title:        "Final Push",
      description:  `Complete remaining work and deliver on "${input.goalTitle}".`,
      month_start:  addMonths(cm, off(total, 0.8)),
      target_value: Math.max(8, Math.round(hoursPerMonth * 0.9)),
      target_unit:  "hours",
      impactLevel:  "critical",
      weight:       3,
      reasoning:    "The final stretch requires maximum output — protect this time from distractions.",
    },
  ]

  const weeklyHours = Math.max(1, Math.round(input.weeklyAvailabilityHours * 0.8))

  const weeklyGoals: BlueprintWeeklyGoal[] = [
    {
      tempId:        "weekly_1",
      monthlyTempId: "monthly_1",
      title:         `Dedicate ${weeklyHours} hours to the goal`,
      description:   "Block time and do the core work — no distractions or multitasking.",
      week_start:    ws,
      target_value:  weeklyHours,
      target_unit:   "hours",
      reasoning:     "Showing up consistently for the work is the most important first-week action.",
    },
    {
      tempId:        "weekly_2",
      monthlyTempId: "monthly_1",
      title:         "Complete one concrete deliverable",
      description:   "Pick one measurable output to finish by end of the week.",
      week_start:    ws,
      target_value:  1,
      target_unit:   "deliverable",
      reasoning:     "A concrete output this week creates momentum and proves the plan is executable.",
    },
  ]

  return { longTermGoal, monthlyGoals, weeklyGoals }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateFallbackBlueprint(
  input: BlueprintInput,
  currentDate: string,
): BlueprintDraft {
  const builder = isCareerGoal(input)
    ? buildCareerBlueprint
    : isFitnessGoal(input)
      ? buildFitnessBlueprint
      : isFinanceGoal(input)
        ? buildFinanceBlueprint
        : buildGeneralBlueprint

  const { longTermGoal, monthlyGoals, weeklyGoals } = builder(input, currentDate)

  return {
    longTermGoal,
    monthlyGoals,
    weeklyGoals,
    summary:
      `Starter blueprint for "${input.goalTitle}" — generated locally based on your ` +
      `${input.weeklyAvailabilityHours}-hour weekly availability.`,
    assumptions:
      `Assumes ${input.weeklyAvailabilityHours} hours of focused weekly availability. ` +
      `Dates calculated from ${currentDate}. Impact levels and targets are heuristic estimates — ` +
      `adjust after reviewing.`,
    source:     "fallback",
    confidence: "low",
  }
}
