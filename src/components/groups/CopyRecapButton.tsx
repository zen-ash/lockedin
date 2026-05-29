"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface CopyRecapButtonProps {
  recapText: string
}

export default function CopyRecapButton({ recapText }: CopyRecapButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(recapText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API may be unavailable in some environments
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
    >
      {copied ? "Copied!" : "Copy Recap"}
    </button>
  )
}
