"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type InviteCodeDisplayProps = {
  inviteCode: string
}

export default function InviteCodeDisplay({ inviteCode }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silent fail
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Invite Code
      </p>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
        <code className="min-w-0 flex-1 break-all font-mono text-sm font-bold tracking-wide text-foreground sm:text-base">
          {inviteCode}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
              <span className="text-emerald-700 dark:text-emerald-300">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Share this code with anyone you want to invite to the group.
      </p>
    </div>
  )
}
