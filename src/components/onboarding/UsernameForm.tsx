"use client"

// Client Component — username selection form during onboarding.
// Forces lowercase, validates format client-side, then calls completeOnboarding Server Action.

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { completeOnboarding } from "@/lib/actions/auth"
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

const schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or less")
    .regex(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores"
    ),
})

type FormData = z.infer<typeof schema>

export default function UsernameForm() {
  const [serverError, setServerError] = useState("")
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: "" },
  })

  function onSubmit(data: FormData) {
    setServerError("")
    startTransition(async () => {
      const result = await completeOnboarding(data)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  {...field}
                  id={`${field.name}-item`}
                  placeholder="your_handle"
                  autoComplete="username"
                  aria-invalid={!!fieldState.error}
                  disabled={isPending}
                  className="pl-7"
                  onChange={(e) =>
                    field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                />
              </div>
              <FormDescription>
                3–20 characters · lowercase letters, numbers, underscores only
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Locking in…" : "Lock In My Username"}
        </Button>
      </form>
    </Form>
  )
}
