import type { GroupMember, Profile } from "@/types/app"
import RemoveMemberButton from "./RemoveMemberButton"

export type MemberWithProfile = GroupMember & {
  profile: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null
}

type GroupMemberListProps = {
  members:       MemberWithProfile[]
  currentUserId: string
  isOwner:       boolean
  groupId:       string
}

export default function GroupMemberList({
  members,
  currentUserId,
  isOwner,
  groupId,
}: GroupMemberListProps) {
  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => {
        const profile       = member.profile
        const displayName   = profile?.full_name || profile?.username || "Unknown"
        const username      = profile?.username ? `@${profile.username}` : null
        const isCurrentUser = member.user_id === currentUserId
        const isMemberOwner = member.role === "owner"
        const initials      = (
          profile?.full_name?.[0] ??
          profile?.username?.[0] ??
          "?"
        ).toUpperCase()

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {initials}
            </div>

            {/* Name + username */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
                {isCurrentUser && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    (you)
                  </span>
                )}
              </p>
              {username && (
                <p className="truncate text-xs text-muted-foreground">
                  {username}
                </p>
              )}
            </div>

            {/* Role + joined date */}
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={
                  isMemberOwner
                    ? "rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary"
                    : "rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                }
              >
                {isMemberOwner ? "Owner" : "Member"}
              </span>
              <p className="text-[10px] text-muted-foreground/60">
                {new Date(member.joined_at).toLocaleDateString("en-US", {
                  month: "short",
                  year:  "numeric",
                })}
              </p>
            </div>

            {/* Remove — owner only, not self, not another owner */}
            {isOwner && !isCurrentUser && !isMemberOwner && (
              <RemoveMemberButton
                groupId={groupId}
                memberUserId={member.user_id}
                memberName={displayName}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
