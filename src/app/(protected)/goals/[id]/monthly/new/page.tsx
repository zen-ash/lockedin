import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import MonthlyGoalForm from "@/components/monthly-goals/MonthlyGoalForm"

export default async function NewMonthlyGoalPage({
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
    .select("id, title")
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
          ← {goal.title}
        </Link>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          New Monthly Goal
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Add a monthly milestone for this goal.
        </p>
      </div>

      <div className="max-w-lg">
        <MonthlyGoalForm
          mode="create"
          goalId={id}
          cancelHref={`/goals/${id}`}
        />
      </div>
    </div>
  )
}
