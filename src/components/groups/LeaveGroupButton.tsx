"use client"

import { useState, useTransition } from "react"
import { leaveGroup } from "@/lib/actions/groups"

type LeaveGroupButtonProps = {
  groupId:   string
  groupName: string
}

export default function LeaveGroupButton({
  groupId,
  groupName,
}: LeaveGroupButtonProps) {
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleLeave() {
    if (
      !confirm(
        `Leave "${groupName}"? You will need a new invite code to rejoin.`,
      )
    )
      return

    setError("")
    startTransition(async () => {
      const result = await leaveGroup(groupId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleLeave}
        disabled={isPending}
        className="w-fit rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? "Leaving…" : "Leave Group"}
      </button>
      {error && (
        <p className="max-w-sm text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
