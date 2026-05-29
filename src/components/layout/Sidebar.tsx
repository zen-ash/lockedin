"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signout } from "@/lib/actions/auth"
import ThemeToggle from "@/components/layout/ThemeToggle"
import type { Profile } from "@/types/app"

type SidebarProps = {
  profile: Pick<Profile, "username" | "full_name" | "avatar_url">
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/goals",     label: "Goals",     icon: Target,          enabled: true },
  { href: "/tasks",     label: "Weekly Goals", icon: CheckSquare,  enabled: true },
  { href: "/groups",    label: "Groups",    icon: Users,           enabled: true },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  const initials = profile.username?.[0]?.toUpperCase() ?? "?"

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="font-serif text-lg font-bold italic tracking-tight text-foreground">
          Locked<span className="text-primary not-italic">In</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, enabled }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)

          if (!enabled) {
            return (
              <div
                key={href}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/40"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                <span className="ml-auto text-[10px] text-muted-foreground/30">
                  Soon
                </span>
              </div>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              @{profile.username}
            </p>
            {profile.full_name && (
              <p className="truncate text-xs text-muted-foreground">
                {profile.full_name}
              </p>
            )}
          </div>
          <ThemeToggle />
        </div>

        <form action={signout}>
          <button
            type="submit"
            className="mt-1 w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
