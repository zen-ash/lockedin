"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { weeklyGoalRatingSchema } from "@/lib/ratings-schema"
import type { WeeklyGoalRatingData } from "@/lib/ratings-schema"
import { upsertWeeklyGoalRating, deleteWeeklyGoalRating } from "@/lib/actions/ratings"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

const STARS = [1, 2, 3, 4, 5] as const

interface RatingFormProps {
  weeklyTaskId:    string
  existingRating?: { id: string; rating: number; comment: string | null }
}

export default function RatingForm({
  weeklyTaskId,
  existingRating,
}: RatingFormProps) {
  const [serverError, setServerError] = useState("")
  const [success, setSuccess]         = useState(false)
  const [isPending, startTransition]  = useTransition()
  const [hovered, setHovered]         = useState(0)

  const form = useForm<WeeklyGoalRatingData>({
    resolver: zodResolver(weeklyGoalRatingSchema),
    defaultValues: {
      weekly_task_id: weeklyTaskId,
      rating:         existingRating?.rating ?? 0,
      comment:        existingRating?.comment ?? "",
    },
  })

  const currentRating = form.watch("rating")

  function onSubmit(data: WeeklyGoalRatingData) {
    setServerError("")
    setSuccess(false)
    startTransition(async () => {
      const result = await upsertWeeklyGoalRating(data)
      if (result?.error) {
        setServerError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  function onDelete() {
    if (!existingRating) return
    setServerError("")
    startTransition(async () => {
      const result = await deleteWeeklyGoalRating(existingRating.id)
      if (result?.error) {
        setServerError(result.error)
      } else {
        form.reset({ weekly_task_id: weeklyTaskId, rating: 0, comment: "" })
        setSuccess(false)
      }
    })
  }

  const displayRating = hovered || currentRating

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Star selector */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Your Rating</FormLabel>
              <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHovered(0)}
                aria-invalid={!!fieldState.error}
              >
                {STARS.map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={isPending}
                    onMouseEnter={() => setHovered(star)}
                    onClick={() => field.onChange(star)}
                    className={cn(
                      "text-2xl leading-none transition-colors disabled:opacity-50",
                      star <= displayRating
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-muted-foreground/30 hover:text-amber-500 dark:hover:text-amber-400",
                    )}
                    aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
                {currentRating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {currentRating}/5
                  </span>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Comment */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Review{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <textarea
                {...field}
                id="comment-item"
                placeholder="Any feedback on their execution this week?"
                className={cn(
                  "min-h-[72px] w-full min-w-0 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                  fieldState.error && "border-destructive",
                )}
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
            Review saved.
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending || currentRating === 0}>
            {isPending ? "Saving…" : existingRating ? "Update Rating" : "Submit Rating"}
          </Button>
          {existingRating && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="text-sm text-destructive transition-colors hover:text-destructive/80 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </form>
    </Form>
  )
}
