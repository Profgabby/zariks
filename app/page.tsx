import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isApprovedZariksEmail } from "@/lib/zariks-users";
import DashboardClient from "./DashboardClient";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email?.toLowerCase() ?? "";
  if (!isApprovedZariksEmail(email)) {
    await supabase.auth.signOut();
    redirect("/login?message=This%20account%20is%20not%20authorized%20for%20ZARIKS.");
  }

  const { data: member } = await supabase
    .from("procurement_members")
    .select("active")
    .eq("email", email)
    .maybeSingle();

  if (!member?.active) {
    await supabase.auth.signOut();
    redirect("/login?message=This%20ZARIKS%20account%20is%20not%20active.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role, active")
    .eq("id", user.id)
    .single();

  if (error) console.error("Profile error:", error);

  if (profile?.active === false) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <DashboardClient
      user={{
        email: user.email ?? "",
        fullName: profile?.full_name ?? user.email ?? "ZARIKS User",
        role: profile?.role ?? "requester",
      }}
    />
  );
}
