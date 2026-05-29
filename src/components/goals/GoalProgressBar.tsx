import { cn } from "@/lib/utils"

interface GoalProgressBarProps {
  value: number
  showLabel?: boolean
  className?: string
}

export default function GoalProgressBar({
  value,
  showLabel = false,
  className,
}: GoalProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{clamped}%</span>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
