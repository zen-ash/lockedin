"use client"

import { useState, useTransition } from "react"
import { removeMember } from "@/lib/actions/groups"

type RemoveMemberButtonProps = {
  groupId:      string
  memberUserId: string
  memberName:   string
}

export default function RemoveMemberButton({
  groupId,
  memberUserId,
  memberName,
}: RemoveMemberButtonProps) {
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    if (!confirm(`Remove ${memberName} from the group?`)) return

    setError("")
    startTransition(async () => {
      const result = await removeMember(groupId, memberUserId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="text-xs text-muted-foreground/50 transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? "Removing…" : "Remove"}
      </button>
      {error && (
        <p className="max-w-[180px] text-right text-[10px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
