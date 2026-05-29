"use client"

import { useState, useTransition } from "react"
import { deleteGoal } from "@/lib/actions/goals"
import { Button } from "@/components/ui/button"

interface DeleteGoalButtonProps {
  goalId: string
}

export default function DeleteGoalButton({ goalId }: DeleteGoalButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleDelete() {
    if (!window.confirm("Delete this long-term goal? This cannot be undone.")) return

    setError("")
    startTransition(async () => {
      const result = await deleteGoal(goalId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? "Deleting…" : "Delete Goal"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
