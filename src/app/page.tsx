// Server Component — public landing page.
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />

      {/* Violet glow orb */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-4 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Lock className="h-3 w-3" />
          Social Accountability &middot; Goal Tracking &middot; Weekly Competition
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-5">
          <h1 className="text-7xl font-black tracking-tighter text-foreground sm:text-8xl lg:text-[9rem] leading-none">
            LOCKED
            <span className="text-primary">IN</span>
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground sm:text-xl leading-relaxed">
            Lock in your goals. Hold each other accountable.
            <br />
            Compete with your crew every single week.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth/signup"
            className={cn(buttonVariants({ size: "lg" }), "px-8 text-base font-semibold")}
          >
            Get Started Free
          </Link>
          <Link
            href="/auth/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8 text-base")}
          >
            Sign In
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Weekly Edit Lock",
            "Group Leaderboards",
            "Peer Ratings",
            "Streaks",
            "Weekly Recaps",
          ].map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </main>
  )
}
