import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import MonthlyGoalForm from "@/components/monthly-goals/MonthlyGoalForm"
import type { MonthlyGoalCategory } from "@/lib/monthly-goals-schema"

export default async function EditMonthlyGoalPage({
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

  const { data: mg } = await supabase
    .from("monthly_goals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!mg) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/monthly-goals/${id}`}
          className="mb-1 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to monthly goal
        </Link>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Edit Monthly Goal
        </h1>
      </div>

      <div className="max-w-lg">
        <MonthlyGoalForm
          mode="edit"
          goalId={mg.goal_id}
          monthlyGoalId={id}
          cancelHref={`/monthly-goals/${id}`}
          defaultValues={{
            title:        mg.title,
            description:  mg.description ?? "",
            month_start:  mg.month_start.substring(0, 7),  // "YYYY-MM-01" → "YYYY-MM"
            category:     (mg.category as MonthlyGoalCategory) ?? undefined,
            status:       mg.status as "active" | "completed" | "paused" | "abandoned",
            weight:       mg.weight,
            target_value: mg.target_value ?? undefined,
            target_unit:  mg.target_unit ?? "",
          }}
        />
      </div>
    </div>
  )
}
