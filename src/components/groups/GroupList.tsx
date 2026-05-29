import GroupCard from "./GroupCard"
import type { Group } from "@/types/app"

type GroupListItem = {
  group:       Group
  role:        string
  memberCount: number
}

type GroupListProps = {
  items: GroupListItem[]
}

export default function GroupList({ items }: GroupListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ group, role, memberCount }) => (
        <GroupCard
          key={group.id}
          group={group}
          role={role}
          memberCount={memberCount}
        />
      ))}
    </div>
  )
}
