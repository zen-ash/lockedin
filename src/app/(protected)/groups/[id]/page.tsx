import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getCurrentWeekStartUTC,
  formatDateForSupabase,
  formatWeekRange,
} from "@/lib/utils/week"
import InviteCodeDisplay from "@/components/groups/InviteCodeDisplay"
import GroupMemberList from "@/components/groups/GroupMemberList"
import LeaveGroupButton from "@/components/groups/LeaveGroupButton"
import GroupAccountabilityDashboard from "@/components/groups/GroupAccountabilityDashboard"
import type { MemberWithProfile } from "@/components/groups/GroupMemberList"
import type { DashboardMember } from "@/components/groups/MemberAccountabilityCard"

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
  searchParams?: Promise<{ week?: string }>
}) {
  const { id }              = await params
  const resolvedSearch      = searchParams ? await searchParams : {}
  const weekParam           = resolvedSearch.week ?? ""

  // Resolve selected week — must be a Monday (day=1 in UTC)
  const currentWeekStart    = getCurrentWeekStartUTC()
  const currentWeekStr      = formatDateForSupabase(currentWeekStart)

  let weekStartStr = currentWeekStr
  if (/^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    const candidate = new Date(weekParam + "T00:00:00Z")
    if (!isNaN(candidate.getTime()) && candidate.getUTCDay() === 1) {
      weekStartStr = weekParam
    }
  }

  const weekRange    = formatWeekRange(new Date(weekStartStr + "T00:00:00Z"))
  const isCurrentWeek = weekStartStr === currentWeekStr

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [
    { data: group },
    { data: myMembership },
    { data: members },
  ] = await Promise.all([
    supabase.from("groups").select("*").eq("id", id).single(),
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("group_members")
      .select("*")
      .eq("group_id", id)
      .order("joined_at", { ascending: true }),
  ])

  if (!group || !myMembership) notFound()

  const userIds = (members ?? []).map((m) => m.user_id)
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", userIds)
      : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const membersWithProfiles: MemberWithProfile[] = (members ?? []).map((m) => ({
    ...m,
    profile: profileMap[m.user_id] ?? null,
  }))

  // DashboardMember is a subset of MemberWithProfile — cast directly
  const dashboardMembers: DashboardMember[] = membersWithProfiles.map((m) => ({
    user_id: m.user_id,
    role:    m.role,
    profile: m.profile
      ? {
          id:         m.profile.id,
          username:   m.profile.username,
          full_name:  m.profile.full_name,
          avatar_url: m.profile.avatar_url,
        }
      : null,
  }))

  const isOwner     = myMembership.role === "owner"
  const memberCount = membersWithProfiles.length
  const createdDate = new Date(group.created_at).toLocaleDateString("en-US", {
    month: "long",
    day:   "numeric",
    year:  "numeric",
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/groups"
            className="mb-1 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Groups
          </Link>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {group.description}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground/60">
            Created {createdDate}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
            isOwner
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-muted/50 text-muted-foreground",
          )}
        >
          {isOwner ? "Owner" : "Member"}
        </span>
      </div>

      {/* Invite code card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <InviteCodeDisplay inviteCode={group.invite_code} />
      </div>

      {/* Owner controls */}
      {isOwner && (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/groups/${group.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit Group
          </Link>
        </div>
      )}

      {/* Weekly accountability dashboard */}
      <GroupAccountabilityDashboard
        groupId={group.id}
        currentUserId={user.id}
        members={dashboardMembers}
        weekStartStr={weekStartStr}
        weekRange={weekRange}
        isCurrentWeek={isCurrentWeek}
      />

      {/* Member list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Members ({memberCount})
        </h2>
        <GroupMemberList
          members={membersWithProfiles}
          currentUserId={user.id}
          isOwner={isOwner}
          groupId={group.id}
        />
      </div>

      {/* Leave group */}
      <div className="border-t border-border pt-6">
        {isOwner && (
          <p className="mb-3 text-xs text-muted-foreground/60">
            You are the owner. You cannot leave unless another owner exists.
          </p>
        )}
        <LeaveGroupButton groupId={group.id} groupName={group.name} />
      </div>
    </div>
  )
}
