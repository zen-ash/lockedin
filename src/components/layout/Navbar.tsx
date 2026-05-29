"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { signout } from "@/lib/actions/auth"
import ThemeToggle from "@/components/layout/ThemeToggle"
import type { Profile } from "@/types/app"

type NavbarProps = {
  profile: Pick<Profile, "username" | "full_name" | "avatar_url">
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", enabled: true },
  { href: "/goals",     label: "Goals",     enabled: true },
  { href: "/tasks",     label: "Weekly Goals", enabled: true },
  { href: "/groups",    label: "Groups",    enabled: true },
]

export default function Navbar({ profile }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const initials = profile.username?.[0]?.toUpperCase() ?? "?"

  const currentPage =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.label ?? "Dashboard"

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      {/* Mobile: wordmark */}
      <div className="flex items-center lg:hidden">
        <span className="font-serif text-base font-bold italic tracking-tight text-foreground">
          Locked<span className="text-primary not-italic">In</span>
        </span>
      </div>

      {/* Desktop: current section label */}
      <span className="hidden text-sm text-muted-foreground lg:block">
        {currentPage}
      </span>

      {/* Desktop: theme toggle + user pill */}
      <div className="hidden items-center gap-2 lg:flex">
        <ThemeToggle />
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
            {initials}
          </div>
          <span className="text-sm text-muted-foreground">
            @{profile.username}
          </span>
        </div>
      </div>

      {/* Mobile: theme toggle + hamburger */}
      <div className="flex items-center gap-1 lg:hidden">
        <ThemeToggle />
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute inset-x-0 top-14 z-50 border-b border-border bg-background px-4 py-4 shadow-md lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ href, label, enabled }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`)

              if (!enabled) {
                return (
                  <div
                    key={href}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground/40"
                  >
                    <span>{label}</span>
                    <span className="text-[10px] text-muted-foreground/30">
                      Soon
                    </span>
                  </div>
                )
              }

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  @{profile.username}
                </p>
                {profile.full_name && (
                  <p className="text-xs text-muted-foreground">
                    {profile.full_name}
                  </p>
                )}
              </div>
            </div>

            <form action={signout}>
              <button
                type="submit"
                className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
