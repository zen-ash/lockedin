"use client"

import { useState, useTransition } from "react"
import { deleteMonthlyGoal } from "@/lib/actions/monthly-goals"
import { Button } from "@/components/ui/button"

interface DeleteMonthlyGoalButtonProps {
  monthlyGoalId: string
}

export default function DeleteMonthlyGoalButton({ monthlyGoalId }: DeleteMonthlyGoalButtonProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    setError("")
    startTransition(async () => {
      const result = await deleteMonthlyGoal(monthlyGoalId)
      if (result?.error) {
        setError(result.error)
        setConfirmed(false)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Deleting…" : confirmed ? "Confirm Delete" : "Delete"}
      </Button>
      {confirmed && !isPending && (
        <p className="text-xs text-muted-foreground">Click again to confirm.</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
