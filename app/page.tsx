import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import DashboardClient from "./DashboardClient";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role, active")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Profile error:", error);
  }

  if (profile?.active === false) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <DashboardClient
      user={{
        email: user.email ?? "",
        fullName:
          profile?.full_name ??
          user.email ??
          "ZARIKS User",
        role: profile?.role ?? "requester",
      }}
    />
  );
}