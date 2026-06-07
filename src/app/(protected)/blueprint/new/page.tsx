import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BlueprintGeneratorForm from "@/components/blueprint/BlueprintGeneratorForm"

export default async function BlueprintNewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Blueprint
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Generate Blueprint
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn one ambition into a structured execution plan.
        </p>
      </div>

      <BlueprintGeneratorForm />
    </div>
  )
}
