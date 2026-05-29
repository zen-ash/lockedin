"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { joinGroupSchema, type JoinGroupData } from "@/lib/groups-schema"
import { joinGroup } from "@/lib/actions/groups"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export default function JoinGroupForm() {
  const [serverError, setServerError] = useState("")
  const [isPending, startTransition]  = useTransition()

  const form = useForm<JoinGroupData>({
    resolver:      zodResolver(joinGroupSchema),
    defaultValues: { invite_code: "" },
  })

  function onSubmit(data: JoinGroupData) {
    setServerError("")
    startTransition(async () => {
      const result = await joinGroup(data)
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
          name="invite_code"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Invite Code</FormLabel>
              <Input
                {...field}
                id="invite-code-item"
                placeholder="Paste your invite code here"
                aria-invalid={!!fieldState.error}
                disabled={isPending}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) =>
                  field.onChange(e.target.value.toUpperCase())
                }
              />
              <p className="text-xs text-muted-foreground">
                Ask a group member to share the invite code from their group page.
              </p>
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
            {isPending ? "Joining…" : "Join Group"}
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
