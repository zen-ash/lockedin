import GoalCard from "@/components/goals/GoalCard"
import type { Goal } from "@/types/app"

interface GoalListProps {
  goals: Goal[]
}

export default function GoalList({ goals }: GoalListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  )
}
