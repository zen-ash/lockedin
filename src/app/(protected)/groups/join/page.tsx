import Link from "next/link"
import JoinGroupForm from "@/components/groups/JoinGroupForm"

export default function JoinGroupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/groups"
          className="mb-1 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Groups
        </Link>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Join Group
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Enter an invite code to join a group.
        </p>
      </div>

      <div className="max-w-md">
        <JoinGroupForm />
      </div>
    </div>
  )
}
