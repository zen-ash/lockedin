import Link from "next/link"
import GoalForm from "@/components/goals/GoalForm"

export default function NewGoalPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/goals"
          className="mb-1 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Goals
        </Link>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          New Goal
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Define a new long-term objective.
        </p>
      </div>

      <div className="max-w-lg">
        <GoalForm mode="create" cancelHref="/goals" />
      </div>
    </div>
  )
}
