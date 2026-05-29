"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import {
  goalSchema,
  GOAL_CATEGORIES,
  GOAL_STATUSES,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type GoalFormData,
} from "@/lib/goals-schema"
import { createGoal, updateGoal } from "@/lib/actions/goals"
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

interface GoalFormProps {
  mode: "create" | "edit"
  goalId?: string
  defaultValues?: Partial<GoalFormData>
  cancelHref?: string
}

export default function GoalForm({
  mode,
  goalId,
  defaultValues,
  cancelHref = "/goals",
}: GoalFormProps) {
  const [serverError, setServerError] = useState("")
  const [isPending, startTransition] = useTransition()

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title:        "",
      description:  "",
      category:     "personal",
      target_date:  "",
      status:       "active",
      progress_pct: 0,
      ...defaultValues,
    },
  })

  function onSubmit(data: GoalFormData) {
    setServerError("")
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createGoal(data)
          : await updateGoal(goalId!, data)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
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
                placeholder="e.g. Run a half-marathon"
                aria-invalid={!!fieldState.error}
                disabled={isPending}
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
              <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
              <textarea
                {...field}
                id={`${field.name}-item`}
                placeholder="What does success look like?"
                className={cn(textareaCls, fieldState.error && "border-destructive")}
                disabled={isPending}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category + Status row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <select
                  {...field}
                  id={`${field.name}-item`}
                  className={cn(selectCls, fieldState.error && "border-destructive")}
                  disabled={isPending}
                >
                  {GOAL_CATEGORIES.map((cat) => (
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
                  {GOAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Target date */}
        <FormField
          control={form.control}
          name="target_date"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Target Date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
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

        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? mode === "create"
                ? "Creating…"
                : "Saving…"
              : mode === "create"
                ? "Create Goal"
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
