import Link from "next/link"
import CreateGroupForm from "@/components/groups/CreateGroupForm"

export default function NewGroupPage() {
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
          Create Group
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Start a new accountability circle.
        </p>
      </div>

      <div className="max-w-lg">
        <CreateGroupForm />
      </div>
    </div>
  )
}
