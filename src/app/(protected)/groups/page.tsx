import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import GroupList from "@/components/groups/GroupList"
import type { Group } from "@/types/app"

export default async function GroupsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", user.id)

  const groupIds = (memberships ?? []).map((m) => m.group_id)

  let groups: Group[]                     = []
  let memberCounts: Record<string, number> = {}

  if (groupIds.length > 0) {
    const [{ data: groupsData }, { data: allMembers }] = await Promise.all([
      supabase
        .from("groups")
        .select("*")
        .in("id", groupIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds),
    ])

    groups = groupsData ?? []

    for (const m of allMembers ?? []) {
      memberCounts[m.group_id] = (memberCounts[m.group_id] ?? 0) + 1
    }
  }

  const roleMap = Object.fromEntries(
    (memberships ?? []).map((m) => [m.group_id, m.role]),
  )

  const items = groups.map((group) => ({
    group,
    role:        roleMap[group.id] ?? "member",
    memberCount: memberCounts[group.id] ?? 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Groups
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Your accountability <span className="italic text-primary">circles.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build discipline together, week by week.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/groups/join"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Join Group
          </Link>
          <Link
            href="/groups/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            New Group
          </Link>
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            You are not in any groups yet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a group or join one with an invite code.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link
              href="/groups/new"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              Create a group
            </Link>
            <Link
              href="/groups/join"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
              )}
            >
              Join with invite code
            </Link>
          </div>
        </div>
      ) : (
        <GroupList items={items} />
      )}
    </div>
  )
}
