import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import EditGroupForm from "@/components/groups/EditGroupForm"

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [{ data: group }, { data: membership }] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name, description")
      .eq("id", id)
      .single(),
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single(),
  ])

  if (!group || !membership || membership.role !== "owner") notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/groups/${id}`}
          className="mb-1 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {group.name}
        </Link>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Edit Group
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Update the group name or description.
        </p>
      </div>

      <div className="max-w-lg">
        <EditGroupForm
          groupId={group.id}
          defaultValues={{
            name:        group.name,
            description: group.description ?? "",
          }}
        />
      </div>
    </div>
  )
}
