"use client"

// Client Component — signup form with react-hook-form + zod validation.
// Calls the `signup` Server Action and handles server-side error responses.

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signup } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  fullName: z
    .string()
    .min(1, "Enter your name")
    .max(60, "Name must be 60 characters or less"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
})

type FormData = z.infer<typeof schema>

export default function SignupForm() {
  const [serverError, setServerError] = useState("")
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "" },
  })

  function onSubmit(data: FormData) {
    setServerError("")
    startTransition(async () => {
      const result = await signup(data)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <Input
                {...field}
                id={`${field.name}-item`}
                placeholder="Your name"
                autoComplete="name"
                aria-invalid={!!fieldState.error}
                disabled={isPending}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input
                {...field}
                id={`${field.name}-item`}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!fieldState.error}
                disabled={isPending}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <Input
                {...field}
                id={`${field.name}-item`}
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
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

        <Button type="submit" disabled={isPending} className="mt-1 w-full">
          {isPending ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </Form>
  )
}
