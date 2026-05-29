// Server Component — login page shell. Form state lives in LoginForm (Client Component).
import Link from "next/link"
import { Lock } from "lucide-react"
import LoginForm from "@/components/auth/LoginForm"
// Note: no Button import — link navigation uses <Link> with Tailwind classes directly

export default function LoginPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
      </div>

      {/* Client Component — all form state and validation */}
      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
