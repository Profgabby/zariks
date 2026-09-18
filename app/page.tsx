import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import DashboardClient from "./DashboardClient";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  // The database is the single source of truth for Finance access and workflow role.
  // This scales to future managers/requesters without rebuilding a hard-coded email list.
  const { data: member, error: memberError } = await supabase
    .from("procurement_members")
    .select("full_name,workflow_role,active,user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !member?.active) {
    redirect("/login?message=This%20account%20is%20not%20active%20for%20ZARIKS%20Finance.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role,active")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.active === false) {
    redirect("/login?message=This%20ZARIKS%20profile%20is%20not%20active.");
  }

  return (
    <DashboardClient
      user={{
        email: user.email ?? "",
        fullName: profile?.full_name ?? member.full_name ?? user.email ?? "ZARIKS User",
        role: member.workflow_role ?? profile?.role ?? "requester",
        isSuperAdmin: profile?.role === "super_admin",
      }}
    />
  );
}
