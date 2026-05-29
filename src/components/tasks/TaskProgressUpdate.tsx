"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { taskProgressSchema, TASK_STATUSES, STATUS_LABELS } from "@/lib/tasks-schema"
import type { TaskProgressData } from "@/lib/tasks-schema"
import { updateTaskProgress } from "@/lib/actions/tasks"
import { Button } from "@/components/ui/button"
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

interface TaskProgressUpdateProps {
  taskId:        string
  defaultValues: TaskProgressData
}

export default function TaskProgressUpdate({
  taskId,
  defaultValues,
}: TaskProgressUpdateProps) {
  const [serverError, setServerError] = useState("")
  const [success, setSuccess]         = useState(false)
  const [isPending, startTransition]  = useTransition()

  const form = useForm<TaskProgressData>({
    resolver: zodResolver(taskProgressSchema),
    defaultValues: {
      status:     defaultValues.status,
      reflection: defaultValues.reflection ?? "",
    },
  })

  function onSubmit(data: TaskProgressData) {
    setServerError("")
    setSuccess(false)
    startTransition(async () => {
      const result = await updateTaskProgress(taskId, data)
      if (result?.error) {
        setServerError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <select
                {...field}
                id={`${field.name}-item`}
                className={cn(selectCls, fieldState.error && "border-destructive")}
                disabled={isPending}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reflection"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Reflection{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <textarea
                {...field}
                id={`${field.name}-item`}
                placeholder="How did this go? What did you learn?"
                className={cn(textareaCls, fieldState.error && "border-destructive")}
                disabled={isPending}
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

        {success && (
          <div className="rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            Status updated.
          </div>
        )}

        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Update Status"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
