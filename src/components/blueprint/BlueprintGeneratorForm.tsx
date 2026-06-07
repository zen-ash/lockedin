"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { generateGoalBlueprint } from "@/lib/actions/ai"
import type { BlueprintDraft } from "@/lib/utils/blueprint-types"
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
import BlueprintReview from "@/components/blueprint/BlueprintReview"

// ── Shared style tokens ────────────────────────────────────────────────────────

const selectCls =
  "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

const textareaCls =
  "min-h-[88px] w-full min-w-0 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

// ── Constants ─────────────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const CATEGORIES = [
  "Career",
  "Fitness",
  "Finance",
  "Learning",
  "Health",
  "Creative",
  "Personal",
] as const

// ── Form schema ────────────────────────────────────────────────────────────────

const formSchema = z.object({
  goalTitle: z.string().min(1, "Goal title is required"),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .regex(ISO_DATE_RE, "Must be a valid date"),
  weeklyAvailabilityHours: z
    .number()
    .min(1, "At least 1 hour per week")
    .max(80, "Maximum 80 hours per week"),
  goalDescription: z.string().max(2000).optional(),
  category:        z.string().max(50).optional(),
  currentLevel:    z.string().max(1000).optional(),
})

type FormData = z.infer<typeof formSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export default function BlueprintGeneratorForm() {
  const [isPending, startTransition] = useTransition()
  const [blueprint, setBlueprint]     = useState<BlueprintDraft | null>(null)
  const [genError, setGenError]       = useState("")

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goalTitle:               "",
      deadline:                "",
      weeklyAvailabilityHours: 10,
      goalDescription:         "",
      category:                "",
      currentLevel:            "",
    },
  })

  function onSubmit(data: FormData) {
    setGenError("")
    setBlueprint(null)
    startTransition(async () => {
      const result = await generateGoalBlueprint({
        goalTitle:               data.goalTitle,
        deadline:                data.deadline,
        weeklyAvailabilityHours: data.weeklyAvailabilityHours,
        goalDescription:         data.goalDescription  || undefined,
        category:                data.category         || undefined,
        currentLevel:            data.currentLevel     || undefined,
      })

      if (!result.success) {
        setGenError(result.error)
        return
      }

      if (result.message) {
        toast.info(result.message)
      }

      setBlueprint(result.blueprint)
    })
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Input form ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

            {/* Goal title */}
            <FormField
              control={form.control}
              name="goalTitle"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Goal / Ambition</FormLabel>
                  <Input
                    {...field}
                    id={`${field.name}-item`}
                    placeholder="e.g. Get a SWE internship for Summer 2027"
                    aria-invalid={!!fieldState.error}
                    disabled={isPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deadline + Weekly hours */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <Input
                      id={`${field.name}-item`}
                      name={field.name}
                      ref={field.ref}
                      type="date"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(e) => field.onChange(e.target.value)}
                      aria-invalid={!!fieldState.error}
                      disabled={isPending}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weeklyAvailabilityHours"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Weekly Hours</FormLabel>
                    <Input
                      id={`${field.name}-item`}
                      name={field.name}
                      ref={field.ref}
                      type="number"
                      min={1}
                      max={80}
                      step={1}
                      value={field.value !== undefined ? String(field.value) : ""}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        field.onChange(isNaN(v) ? undefined : v)
                      }}
                      aria-invalid={!!fieldState.error}
                      disabled={isPending}
                      placeholder="10"
                    />
                    <FormDescription>Hours available per week</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Context */}
            <FormField
              control={form.control}
              name="goalDescription"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Context{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <textarea
                    {...field}
                    id={`${field.name}-item`}
                    placeholder="e.g. Freshman CS student with Python projects, applying from Atlanta"
                    className={cn(textareaCls, fieldState.error && "border-destructive")}
                    disabled={isPending}
                  />
                  <FormDescription>
                    Background, current level, or constraints that help the planner.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category + Current level */}
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
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      className={cn(selectCls, fieldState.error && "border-destructive")}
                      disabled={isPending}
                    >
                      <option value="">— None —</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentLevel"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Current Level{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <Input
                      {...field}
                      id={`${field.name}-item`}
                      value={field.value ?? ""}
                      placeholder="e.g. Beginner, 1 year of Python"
                      aria-invalid={!!fieldState.error}
                      disabled={isPending}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {genError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {genError}
              </div>
            )}

            <div className="pt-1">
              <Button type="submit" disabled={isPending}>
                <Sparkles
                  className={cn("size-3.5", isPending && "animate-pulse")}
                  aria-hidden="true"
                />
                {isPending ? "Generating…" : "Generate Blueprint"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* ── Loading skeleton ───────────────────────────────────────────── */}
      {isPending && (
        <div className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 h-3 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
            <div className="mt-1.5 h-4 w-5/6 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-2 h-4 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
                <div className="mt-1.5 h-4 w-4/5 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Editable Blueprint Review ──────────────────────────────────── */}
      {!isPending && blueprint && (
        <BlueprintReview blueprint={blueprint} onChange={setBlueprint} />
      )}
    </div>
  )
}
