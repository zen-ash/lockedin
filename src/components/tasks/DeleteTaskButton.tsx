"use client"

import { useState, useTransition } from "react"
import { deleteTask } from "@/lib/actions/tasks"
import { Button } from "@/components/ui/button"

interface DeleteTaskButtonProps {
  taskId: string
  locked: boolean
}

export default function DeleteTaskButton({ taskId, locked }: DeleteTaskButtonProps) {
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  if (locked) return null

  function handleDelete() {
    if (!confirm("Delete this weekly goal? This cannot be undone.")) return
    setError("")
    startTransition(async () => {
      const result = await deleteTask(taskId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
