import MonthlyGoalCard from "./MonthlyGoalCard"
import type { MonthlyGoal } from "@/types/app"

interface MonthlyGoalListProps {
  monthlyGoals: MonthlyGoal[]
}

export default function MonthlyGoalList({ monthlyGoals }: MonthlyGoalListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {monthlyGoals.map((mg) => (
        <MonthlyGoalCard key={mg.id} mg={mg} />
      ))}
    </div>
  )
}
