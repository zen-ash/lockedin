import { Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"

interface LockBadgeProps {
  locked: boolean
  className?: string
}

export default function LockBadge({ locked, className }: LockBadgeProps) {
  if (locked) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive",
          className,
        )}
      >
        <Lock className="h-2.5 w-2.5" />
        Locked
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        className,
      )}
    >
      <Unlock className="h-2.5 w-2.5" />
      Editable
    </span>
  )
}
