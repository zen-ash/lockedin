import TaskCard from "./TaskCard"
import type { TaskWithHierarchy } from "@/types/app"

interface WeeklyTaskListProps {
  tasks: TaskWithHierarchy[]
  locked: boolean
}

export default function WeeklyTaskList({ tasks, locked }: WeeklyTaskListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          locked={locked}
        />
      ))}
    </div>
  )
}
