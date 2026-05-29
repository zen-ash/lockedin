"use client"

import { useState, useTransition } from "react"
import { deleteProgressLog } from "@/lib/actions/progress-logs"

interface DeleteProgressLogButtonProps {
  logId: string
}

export default function DeleteProgressLogButton({ logId }: DeleteProgressLogButtonProps) {
  const [error, setError]             = useState("")
  const [isPending, startTransition]  = useTransition()

  function handleDelete() {
    if (!window.confirm("Remove this log entry? This cannot be undone.")) return
    setError("")
    startTransition(async () => {
      const result = await deleteProgressLog(logId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Remove progress log entry"
        className="text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
      >
        {isPending ? "Removing…" : "Remove"}
      </button>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
