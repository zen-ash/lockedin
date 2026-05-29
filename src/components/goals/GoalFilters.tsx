import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  GOAL_STATUSES,
  GOAL_CATEGORIES,
  STATUS_LABELS,
  CATEGORY_LABELS,
} from "@/lib/goals-schema"

interface GoalFiltersProps {
  currentStatus?: string
  currentCategory?: string
}

function filterHref(
  param: "status" | "category",
  value: string,
  currentStatus?: string,
  currentCategory?: string,
) {
  const params: Record<string, string> = {}
  if (currentStatus) params.status = currentStatus
  if (currentCategory) params.category = currentCategory

  if (params[param] === value) {
    delete params[param]
  } else {
    params[param] = value
  }

  const qs = new URLSearchParams(params).toString()
  return `/goals${qs ? `?${qs}` : ""}`
}

export default function GoalFilters({
  currentStatus,
  currentCategory,
}: GoalFiltersProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="pr-1 text-xs text-muted-foreground">Status:</span>
        {GOAL_STATUSES.map((status) => (
          <Link
            key={status}
            href={filterHref("status", status, currentStatus, currentCategory)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              currentStatus === status
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {STATUS_LABELS[status]}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="pr-1 text-xs text-muted-foreground">Category:</span>
        {GOAL_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={filterHref("category", cat, currentStatus, currentCategory)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              currentCategory === cat
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {CATEGORY_LABELS[cat]}
          </Link>
        ))}
      </div>
    </div>
  )
}
