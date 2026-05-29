"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createProgressLogSchema } from "@/lib/progress-logs-schema"
import type { CreateProgressLogData } from "@/lib/progress-logs-schema"
import { createProgressLog } from "@/lib/actions/progress-logs"
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

const textareaCls =
  "min-h-[72px] w-full min-w-0 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

interface ProgressLogFormProps {
  weeklyTaskId:  string
  targetUnit:    string | null
  isGroupShared: boolean
}

export default function ProgressLogForm({
  weeklyTaskId,
  targetUnit,
  isGroupShared,
}: ProgressLogFormProps) {
  const [serverError, setServerError] = useState("")
  const [success, setSuccess]         = useState(false)
  const [isPending, startTransition]  = useTransition()

  const form = useForm<CreateProgressLogData>({
    resolver: zodResolver(createProgressLogSchema),
    defaultValues: {
      weekly_task_id: weeklyTaskId,
      log_date:       todayStr(),
      value_added:    undefined as unknown as number,
      note:           "",
      is_note_shared: false,
    },
  })

  function onSubmit(data: CreateProgressLogData) {
    setServerError("")
    setSuccess(false)
    startTransition(async () => {
      const result = await createProgressLog(data)
      if (result?.error) {
        setServerError(result.error)
      } else {
        setSuccess(true)
        form.reset({
          weekly_task_id: weeklyTaskId,
          log_date:       todayStr(),
          value_added:    undefined as unknown as number,
          note:           "",
          is_note_shared: false,
        })
      }
    })
  }

  function quickAdd(amount: number) {
    form.setValue("value_added", amount)
    form.handleSubmit(onSubmit)()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="value_added"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Value Added
                  {targetUnit && (
                    <span className="font-normal text-muted-foreground">
                      {" "}({targetUnit})
                    </span>
                  )}
                </FormLabel>
                <Input
                  id={`${field.name}-item`}
                  name={field.name}
                  ref={field.ref}
                  type="number"
                  min={0}
                  step="any"
                  placeholder="e.g. 5"
                  value={field.value != null && !isNaN(field.value) ? String(field.value) : ""}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    field.onChange(isNaN(v) ? undefined : v)
                  }}
                  aria-invalid={!!fieldState.error}
                  disabled={isPending}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="log_date"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Input
                  {...field}
                  id={`${field.name}-item`}
                  type="date"
                  aria-invalid={!!fieldState.error}
                  disabled={isPending}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Note{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <textarea
                {...field}
                id={`${field.name}-item`}
                placeholder="What did you work on?"
                className={cn(textareaCls, fieldState.error && "border-destructive")}
                disabled={isPending}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {isGroupShared && (
          <FormField
            control={form.control}
            name="is_note_shared"
            render={({ field }) => (
              <FormItem>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="is_note_shared-item"
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isPending}
                    className="h-4 w-4 rounded border border-input accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Share this note with my accountability group
                  </span>
                </label>
              </FormItem>
            )}
          />
        )}

        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            Progress logged.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Logging…" : "Log Progress"}
          </Button>
          <button
            type="button"
            onClick={() => quickAdd(1)}
            disabled={isPending}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => quickAdd(5)}
            disabled={isPending}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            +5
          </button>
          <button
            type="button"
            onClick={() => quickAdd(10)}
            disabled={isPending}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            +10
          </button>
        </div>
      </form>
    </Form>
  )
}
