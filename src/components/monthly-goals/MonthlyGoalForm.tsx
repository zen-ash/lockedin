"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import {
  monthlyGoalFormSchema,
  MONTHLY_GOAL_STATUSES,
  MONTHLY_GOAL_CATEGORIES,
  MONTHLY_GOAL_STATUS_LABELS,
  MONTHLY_GOAL_CATEGORY_LABELS,
} from "@/lib/monthly-goals-schema"
import type { MonthlyGoalFormData, MonthlyGoalCategory } from "@/lib/monthly-goals-schema"
import { createMonthlyGoal, updateMonthlyGoal } from "@/lib/actions/monthly-goals"
import { suggestMonthlyGoalWeight } from "@/lib/actions/ai"
import { getWeightLabel } from "@/lib/utils/weight-suggestions"
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

const IMPACT_OPTIONS = [
  { value: 1, label: "Supporting" },
  { value: 2, label: "Important" },
  { value: 3, label: "Critical" },
] as const

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
  const [isCalibrating, setIsCalibrating] = useState(false)

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

  const watchedTitle = form.watch("title")
  const canCalibrate = watchedTitle.trim().length > 0 && !isCalibrating && !isPending

  async function handleAutoCalibrate() {
    if (!canCalibrate) return
    setIsCalibrating(true)
    try {
      const values = form.getValues()
      const result = await suggestMonthlyGoalWeight({
        goal_id:      goalId,
        title:        values.title,
        description:  values.description,
        target_value: values.target_value,
        target_unit:  values.target_unit,
        month_start:  values.month_start,
      })

      if ("error" in result) {
        toast.error("Could not calibrate impact level. You can still choose one manually.")
        return
      }

      form.setValue("weight", result.weight, { shouldValidate: true })

      if (result.source === "ai") {
        toast.success(
          `Suggested impact: ${getWeightLabel(result.weight)} — ${result.reasoning}`,
        )
      } else {
        toast.success(
          `Using a local suggestion — Suggested impact: ${getWeightLabel(result.weight)}. ${result.reasoning}`,
        )
      }
    } catch {
      toast.error("Could not calibrate impact level. You can still choose one manually.")
    } finally {
      setIsCalibrating(false)
    }
  }

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

        {/* Impact Level */}
        <FormField
          control={form.control}
          name="weight"
          render={({ field, fieldState }) => {
            const isCustom = !IMPACT_OPTIONS.some((o) => o.value === field.value)
            return (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>Impact Level</FormLabel>
                  <button
                    type="button"
                    onClick={handleAutoCalibrate}
                    disabled={!canCalibrate}
                    aria-label="Auto-calibrate suggested impact level using AI"
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    {isCalibrating ? "Calibrating…" : "Auto-Calibrate"}
                  </button>
                </div>
                <select
                  id={`${field.name}-item`}
                  name={field.name}
                  ref={field.ref}
                  value={isCustom ? "custom" : String(field.value)}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    if (e.target.value === "custom") return
                    field.onChange(parseInt(e.target.value, 10))
                  }}
                  className={cn(selectCls, fieldState.error && "border-destructive")}
                  disabled={isPending || isCalibrating}
                  aria-invalid={!!fieldState.error}
                >
                  {isCustom && (
                    <option value="custom" disabled>
                      Custom Impact ({field.value})
                    </option>
                  )}
                  {IMPACT_OPTIONS.map((o) => (
                    <option key={o.value} value={String(o.value)}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <FormDescription>
                  Impact level controls how much this monthly goal influences your long-term
                  progress compared with your other monthly goals.
                </FormDescription>
                <p className="mt-0.5 text-[0.8rem] leading-relaxed text-muted-foreground/70">
                  Choose Critical for direct outcome work, Important for meaningful progress, and
                  Supporting for helpful prep work. Auto-Calibrate uses your parent goal and draft
                  milestone to suggest a level.
                </p>
                <FormMessage />
              </FormItem>
            )
          }}
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
          <Button type="submit" disabled={isPending || isCalibrating}>
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
