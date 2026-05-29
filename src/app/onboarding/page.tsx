// Server Component — username onboarding. Accessible only while username IS NULL.
// Middleware enforces the redirect logic; this page does an additional server-side check.
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import UsernameForm from "@/components/onboarding/UsernameForm"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")
  if (user.user_metadata?.username) redirect("/dashboard")

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col gap-8">
          {/* Icon + heading */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-2xl font-black text-primary">
              L
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Choose your username
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This is how your crew will know you. Choose wisely.
              </p>
            </div>
          </div>

          {/* Client Component — form state and validation */}
          <UsernameForm />
        </div>
      </div>
    </div>
  )
}
