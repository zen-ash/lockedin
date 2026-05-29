"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { createGroupSchema, type CreateGroupData } from "@/lib/groups-schema"
import { createGroup } from "@/lib/actions/groups"
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
  "min-h-[88px] w-full min-w-0 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

export default function CreateGroupForm() {
  const [serverError, setServerError] = useState("")
  const [isPending, startTransition]  = useTransition()

  const form = useForm<CreateGroupData>({
    resolver:      zodResolver(createGroupSchema),
    defaultValues: { name: "", description: "" },
  })

  function onSubmit(data: CreateGroupData) {
    setServerError("")
    startTransition(async () => {
      const result = await createGroup(data)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <Input
                {...field}
                id="name-item"
                placeholder="e.g. The Grind Collective"
                aria-invalid={!!fieldState.error}
                disabled={isPending}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FormLabel>
              <textarea
                {...field}
                id="description-item"
                placeholder="What is this group about?"
                className={cn(
                  textareaCls,
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

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Group"}
          </Button>
          <Link
            href="/groups"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Form>
  )
}
