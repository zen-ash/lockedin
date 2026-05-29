"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import {
  monthlyGoalFormSchema,
  MONTHLY_GOAL_STATUSES,
  MONTHLY_GOAL_CATEGORIES,
  MONTHLY_GOAL_STATUS_LABELS,
  MONTHLY_GOAL_CATEGORY_LABELS,
} from "@/lib/monthly-goals-schema"
import type { MonthlyGoalFormData, MonthlyGoalCategory } from "@/lib/monthly-goals-schema"
import { createMonthlyGoal, updateMonthlyGoal } from "@/lib/actions/monthly-goals"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

const selectCls =
  "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

const textareaCls =
  "min-h-[88px] w-full min-w-0 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

interface MonthlyGoalFormProps {
  mode: "create" | "edit"
  goalId: string
  monthlyGoalId?: string
  defaultValues?: Partial<MonthlyGoalFormData>
  cancelHref: string
}

export default function MonthlyGoalForm({
  mode,
  goalId,
  monthlyGoalId,
  defaultValues,
  cancelHref,
}: MonthlyGoalFormProps) {
  const [serverError, setServerError] = useState("")
  const [isPending, startTransition] = useTransition()

  const form = useForm<MonthlyGoalFormData>({
    resolver: zodResolver(monthlyGoalFormSchema),
    defaultValues: {
      title:        "",
      description:  "",
      month_start:  "",
      category:     undefined,
      status:       "active",
      weight:       1,
      target_value: undefined,
      target_unit:  "",
      ...defaultValues,
    },
  })

  function onSubmit(data: MonthlyGoalFormData) {
    setServerError("")
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createMonthlyGoal(goalId, data)
          : await updateMonthlyGoal(monthlyGoalId!, data)
      if (result?.error) setServerError(result.error)
    })
  }

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
                placeholder="e.g. Launch MVP beta"
                aria-invalid={!!fieldState.error}
                disabled={isPending}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Month */}
        <FormField
          control={form.control}
          name="month_start"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Month</FormLabel>
              <Input
                {...field}
                id={`${field.name}-item`}
                type="month"
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
              <FormLabel>
                Description{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <textarea
                {...field}
                id={`${field.name}-item`}
                placeholder="What does success look like this month?"
                className={cn(textareaCls, fieldState.error && "border-destructive")}
                disabled={isPending}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category + Status */}
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
                    field.onChange((e.target.value || undefined) as MonthlyGoalCategory | undefined)
                  }
                  className={cn(selectCls, fieldState.error && "border-destructive")}
                  disabled={isPending}
                >
                  <option value="">— None —</option>
                  {MONTHLY_GOAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {MONTHLY_GOAL_CATEGORY_LABELS[cat]}
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
                  {MONTHLY_GOAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {MONTHLY_GOAL_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Weight */}
        <FormField
          control={form.control}
          name="weight"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Weight</FormLabel>
              <Input
                id={`${field.name}-item`}
                name={field.name}
                ref={field.ref}
                type="number"
                min={0.1}
                step={0.5}
                value={field.value ?? 1}
                onBlur={field.onBlur}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  field.onChange(isNaN(v) ? 1 : Math.max(0.1, v))
                }}
                aria-invalid={!!fieldState.error}
                disabled={isPending}
              />
              <FormDescription>
                How much this milestone counts toward the parent goal's progress. Default is 1.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Value + Target Unit */}
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
                  value={field.value !== undefined ? String(field.value) : ""}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    field.onChange(isNaN(v) ? undefined : v)
                  }}
                  aria-invalid={!!fieldState.error}
                  disabled={isPending}
                  placeholder="e.g. 10"
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
                  Target Unit{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <Input
                  {...field}
                  id={`${field.name}-item`}
                  value={field.value ?? ""}
                  placeholder="e.g. km, chapters, PRs"
                  aria-invalid={!!fieldState.error}
                  disabled={isPending}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                ? "Add Monthly Goal"
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
