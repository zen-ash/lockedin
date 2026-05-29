// Server Component — protected layout with sidebar and navbar.
// An additional server-side auth check is performed here as defense-in-depth
// (middleware is the primary gate, but Server Components must not trust it alone).
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Navbar from "@/components/layout/Navbar"
import Sidebar from "@/components/layout/Sidebar"
import type { Profile } from "@/types/app"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", user.id)
    .single()

  const profileData: Pick<Profile, "username" | "full_name" | "avatar_url"> =
    profile ?? { username: null, full_name: null, avatar_url: null }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — Client Component (active link state) */}
      <Sidebar profile={profileData} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar — Client Component (mobile menu state) */}
        <Navbar profile={profileData} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
