import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import DashboardClient from "./DashboardClient";

const APPROVED_EMAILS = new Set([
  "khadoj85@gmail.com",
  "mediatrixconsultancyservices@gmail.com",
  "1010defranc@gmail.com",
  "ayayiagabriel2020@gmail.com",
]);

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!user.email_confirmed_at) {
    await supabase.auth.signOut();
    redirect("/login?message=Verify%20your%20email%20before%20entering%20ZARIKS.");
  }

  const email = user.email?.toLowerCase() ?? "";
  if (!APPROVED_EMAILS.has(email)) {
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
