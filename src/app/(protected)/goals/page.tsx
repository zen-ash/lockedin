import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import GoalList from "@/components/goals/GoalList"
import GoalFilters from "@/components/goals/GoalFilters"
import { GOAL_STATUSES, GOAL_CATEGORIES } from "@/lib/goals-schema"
import type { Goal } from "@/types/app"

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>
}) {
  const { status, category } = await searchParams

  const safeStatus   = GOAL_STATUSES.includes(status as never)   ? status   : undefined
  const safeCategory = GOAL_CATEGORIES.includes(category as never) ? category : undefined

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  let query = supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (safeStatus)   query = query.eq("status", safeStatus)
  if (safeCategory) query = query.eq("category", safeCategory)

  const { data } = await query
  const goals: Goal[] = data ?? []

  const isFiltered = !!(safeStatus || safeCategory)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Long-Term Goals
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Build what <span className="italic text-primary">matters.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define your objectives. Break them down. Track the distance.
          </p>
        </div>
        <Link
          href="/goals/new"
          className={cn(buttonVariants({ variant: "default" }), "mt-1 shrink-0")}
        >
          New Goal
        </Link>
      </div>

      {/* Filters */}
      <GoalFilters
        currentStatus={safeStatus}
        currentCategory={safeCategory}
      />

      {/* Content */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {isFiltered ? "No goals match the selected filters." : "No long-term goals yet."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFiltered
              ? "Try adjusting or clearing the filters above."
              : "Set the objectives that will guide your months of focused work."}
          </p>
          {!isFiltered && (
            <Link
              href="/goals/new"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-5")}
            >
              Create your first goal
            </Link>
          )}
        </div>
      ) : (
        <GoalList goals={goals} />
      )}
    </div>
  )
}
