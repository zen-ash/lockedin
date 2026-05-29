"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import {
  taskFormSchema,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
} from "@/lib/tasks-schema"
import type { TaskFormData, TaskCategory, MonthlyGoalOption, GoalOption, GroupOption } from "@/lib/tasks-schema"
import { createTask, updateTask } from "@/lib/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

const selectCls =
  "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

const textareaCls =
  "min-h-[88px] w-full min-w-0 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

interface TaskFormProps {
  mode: "create" | "edit"
  taskId?: string
  defaultValues?: Partial<TaskFormData>
  monthlyGoals: MonthlyGoalOption[]
  goals: GoalOption[]
  groups: GroupOption[]
  cancelHref?: string
  isLocked?: boolean
}

export default function TaskForm({
  mode,
  taskId,
  defaultValues,
  monthlyGoals,
  goals,
  groups,
  cancelHref = "/tasks",
  isLocked = false,
}: TaskFormProps) {
  const [serverError, setServerError] = useState("")
  const [isPending, startTransition] = useTransition()

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title:           "",
      description:     "",
      monthly_goal_id: "",
      goal_id:         "",
      group_id:        "",
      category:        undefined,
      priority:        "medium",
      target_value:    undefined,
      target_unit:     "",
      due_date:        "",
      ...defaultValues,
    },
  })

  const selectedMonthlyGoalId = form.watch("monthly_goal_id")
  const showGoalFallback       = !selectedMonthlyGoalId && goals.length > 0

  function onSubmit(data: TaskFormData) {
    if (isLocked) return
    setServerError("")
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTask(data)
          : await updateTask(taskId!, data)
      if (result?.error) setServerError(result.error)
    })
  }

  const disabled = isPending || isLocked

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <Input
                {...field}
                id={`${field.name}-item`}
                placeholder="e.g. Run 3 times this week"
                aria-invalid={!!fieldState.error}
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Description{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <textarea
                {...field}
                id={`${field.name}-item`}
                placeholder="What does success look like?"
                className={cn(textareaCls, fieldState.error && "border-destructive")}
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monthly Goal (primary) */}
        {monthlyGoals.length > 0 && (
          <FormField
            control={form.control}
            name="monthly_goal_id"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Monthly Goal{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <select
                  id={`${field.name}-item`}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    field.onChange(e.target.value || undefined)
                    if (e.target.value) form.setValue("goal_id", "")
                  }}
                  className={cn(selectCls, fieldState.error && "border-destructive")}
                  disabled={disabled}
                >
                  <option value="">— None —</option>
                  {monthlyGoals.map((mg) => (
                    <option key={mg.id} value={mg.id}>
                      {mg.label}
                    </option>
                  ))}
                </select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Linked Goal (fallback — only shown when no monthly goal selected) */}
        {showGoalFallback && (
          <FormField
            control={form.control}
            name="goal_id"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Linked Goal{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <select
                  id={`${field.name}-item`}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                  className={cn(selectCls, fieldState.error && "border-destructive")}
                  disabled={disabled}
                >
                  <option value="">— None —</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Accountability Group */}
        {groups.length > 0 && (
          <FormField
            control={form.control}
            name="group_id"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Accountability Group{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <select
                  id={`${field.name}-item`}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                  className={cn(selectCls, fieldState.error && "border-destructive")}
                  disabled={disabled}
                >
                  <option value="">Private — only you can see this weekly goal</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — members can see this goal, progress, and parent goal context
                    </option>
                  ))}
                </select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Category + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Category{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <select
                  id={`${field.name}-item`}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onChange={(e) =>
                    field.onChange((e.target.value || undefined) as TaskCategory | undefined)
                  }
                  className={cn(selectCls, fieldState.error && "border-destructive")}
                  disabled={disabled}
                >
                  <option value="">— None —</option>
                  {TASK_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <select
                  {...field}
                  id={`${field.name}-item`}
                  className={cn(selectCls, fieldState.error && "border-destructive")}
                  disabled={disabled}
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Target value + unit */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="target_value"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Target Value{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <Input
                  id={`${field.name}-item`}
                  name={field.name}
                  ref={field.ref}
                  type="number"
                  min={0}
                  step="any"
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    field.onChange(isNaN(v) ? undefined : v)
                  }}
                  placeholder="e.g. 5"
                  aria-invalid={!!fieldState.error}
                  disabled={disabled}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target_unit"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Unit{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <Input
                  {...field}
                  id={`${field.name}-item`}
                  placeholder="e.g. km, sessions"
                  aria-invalid={!!fieldState.error}
                  disabled={disabled}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Due date */}
        <FormField
          control={form.control}
          name="due_date"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Due Date{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <Input
                {...field}
                id={`${field.name}-item`}
                type="date"
                aria-invalid={!!fieldState.error}
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={disabled}>
            {isPending
              ? mode === "create"
                ? "Creating…"
                : "Saving…"
              : mode === "create"
                ? "Create Weekly Goal"
                : "Save Changes"}
          </Button>
          <Link
            href={cancelHref}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Form>
  )
}
