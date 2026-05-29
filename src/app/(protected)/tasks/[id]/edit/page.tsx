import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import TaskForm from "@/components/tasks/TaskForm"
import LockBadge from "@/components/tasks/LockBadge"
import { isWeekLocked, formatMonthStart } from "@/lib/utils/week"
import type { TaskCategory, TaskPriority, GroupOption } from "@/lib/tasks-schema"

export default async function EditTaskPage({
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

  const { data: task } = await supabase
    .from("weekly_tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!task) notFound()

  const weekStart = new Date(task.week_start + "T00:00:00Z")
  const locked    = isWeekLocked(weekStart)

  const [{ data: goalsData }, { data: monthlyGoalsData }, { data: membershipsData }] =
    await Promise.all([
      supabase
        .from("goals")
        .select("id, title")
        .eq("user_id", user.id)
        .order("title", { ascending: true }),
      supabase
        .from("monthly_goals")
        .select("id, title, month_start, goals(title)")
        .eq("user_id", user.id)
        .order("month_start", { ascending: false }),
      supabase
        .from("group_members")
        .select("group_id, groups(id, name)")
        .eq("user_id", user.id),
    ])

  const goals = (goalsData ?? []).map((g) => ({ id: g.id, title: g.title }))

  const monthlyGoals = (monthlyGoalsData ?? []).map((mg) => ({
    id:    mg.id,
    label: `${(mg.goals as { title: string } | null)?.title ?? "?"} → ${formatMonthStart(mg.month_start)}: ${mg.title}`,
  }))

  const groups: GroupOption[] = (
    (membershipsData ?? []) as Array<{ group_id: string; groups: { id: string; name: string } | null }>
  )
    .filter((m) => m.groups != null)
    .map((m) => ({ id: m.groups!.id, name: m.groups!.name }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/tasks/${id}`}
          className="mb-1 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to weekly goal
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Edit Weekly Goal
          </h1>
          <LockBadge locked={locked} />
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Update structural fields before the week locks.
        </p>
      </div>

      {locked ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="font-medium text-destructive">This week is locked.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Structural edits are not allowed after Monday 23:59 UTC. You can
            still log progress and update status from the weekly goal detail page.
          </p>
          <Link
            href={`/tasks/${id}`}
            className="mt-4 inline-block text-sm text-primary transition-colors hover:text-primary/80"
          >
            ← Back to weekly goal
          </Link>
        </div>
      ) : (
        <div className="max-w-lg">
          <TaskForm
            mode="edit"
            taskId={id}
            cancelHref={`/tasks/${id}`}
            monthlyGoals={monthlyGoals}
            goals={goals}
            groups={groups}
            defaultValues={{
              title:           task.title,
              description:     task.description ?? "",
              monthly_goal_id: task.monthly_goal_id ?? "",
              goal_id:         task.goal_id ?? "",
              group_id:        task.group_id ?? "",
              category:        (task.category as TaskCategory) ?? undefined,
              priority:        (task.priority as TaskPriority) ?? "medium",
              target_value:    task.target_value ?? undefined,
              target_unit:     task.target_unit ?? "",
              due_date:        task.due_date ?? "",
            }}
          />
        </div>
      )}
    </div>
  )
}
