// Server Component — signup page shell. Form state lives in SignupForm (Client Component).
import Link from "next/link"
import { Lock } from "lucide-react"
import SignupForm from "@/components/auth/SignupForm"

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <Lock className="h-5 w-5 text-primary" />
          <span className="text-xl font-black tracking-tighter">
            LOCKED<span className="text-primary">IN</span>
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start locking in your goals today
          </p>
        </div>
      </div>

      {/* Client Component — all form state and validation */}
      <SignupForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
