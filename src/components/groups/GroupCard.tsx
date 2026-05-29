import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Group } from "@/types/app"

type GroupCardProps = {
  group:       Group
  role:        string
  memberCount: number
}

export default function GroupCard({ group, role, memberCount }: GroupCardProps) {
  const isOwner = role === "owner"

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-1 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
          {group.name}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            isOwner
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-muted/50 text-muted-foreground",
          )}
        >
          {isOwner ? "Owner" : "Member"}
        </span>
      </div>

      {group.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {group.description}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {memberCount} {memberCount === 1 ? "member" : "members"}
      </p>
    </Link>
  )
}
