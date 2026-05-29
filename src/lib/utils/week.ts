// UTC week utilities — all calculations use UTC methods to match DB lock rule.
// DB rule: week_start = Monday 00:00:00 UTC, lock time = Monday 23:59:59 UTC

// Set to false to disable the weekly lock during development.
// TO RE-ENABLE: set to true and run migration to restore is_week_locked() in DB.
export const LOCK_ENABLED = false

export function getCurrentWeekStartUTC(): Date {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const daysFromMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - daysFromMonday)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

export function getWeekLockTimeUTC(weekStart: Date): Date {
  const lockTime = new Date(weekStart)
  lockTime.setUTCHours(23, 59, 59, 999)
  return lockTime
}

export function isWeekLocked(weekStart: Date): boolean {
  if (!LOCK_ENABLED) return false
  const lockTime = getWeekLockTimeUTC(weekStart)
  return Date.now() > lockTime.getTime()
}

export function formatDateForSupabase(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatMonthStart(monthStart: string): string {
  const date = new Date(monthStart + "T00:00:00Z")
  return date.toLocaleDateString("en-US", {
    month: "long",
    year:  "numeric",
    timeZone: "UTC",
  })
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)

  const startStr = weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
  const endStr = weekEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
  return `${startStr} – ${endStr}`
}
