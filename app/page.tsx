import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isApprovedZariksEmail } from "@/lib/zariks-users";
import DashboardClient from "./DashboardClient";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email?.trim().toLowerCase() ?? "";
  if (!isApprovedZariksEmail(email)) {
    redirect("/login?message=This%20account%20is%20not%20authorized%20for%20ZARIKS.");
  }

  // Membership is role-based and should resolve by the authenticated user ID.
  // Keep email as a compatibility fallback for the original four accounts.
  const { data: member } = await supabase
    .from("procurement_members")
    .select("user_id,email,workflow_role,active")
    .or(`user_id.eq.${user.id},email.ilike.${email}`)
    .limit(1)
    .maybeSingle();

  if (!member?.active) {
    redirect("/login?message=This%20ZARIKS%20account%20is%20not%20active.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (error) console.error("Profile error:", error);
  if (profile?.active === false) {
    redirect("/login?message=This%20ZARIKS%20profile%20is%20not%20active.");
  }

  return (
    <DashboardClient
      user={{
        email: user.email ?? "",
        fullName: profile?.full_name ?? user.email ?? "ZARIKS User",
        role: member.workflow_role ?? profile?.role ?? "requester",
      }}
    />
  );
}
