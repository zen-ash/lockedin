import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import GoalForm from "@/components/goals/GoalForm"
import type { GoalCategory, GoalStatus } from "@/lib/goals-schema"

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!goal) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/goals/${id}`}
          className="mb-1 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to goal
        </Link>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Edit Goal
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Update your objective.
        </p>
      </div>

      <div className="max-w-lg">
        <GoalForm
          mode="edit"
          goalId={id}
          cancelHref={`/goals/${id}`}
          defaultValues={{
            title:        goal.title,
            description:  goal.description ?? "",
            category:     goal.category as GoalCategory,
            target_date:  goal.target_date ?? "",
            status:       goal.status as GoalStatus,
            progress_pct: goal.progress_pct,
          }}
        />
      </div>
    </div>
  )
}
