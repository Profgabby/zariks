import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import UserManagementClient from "./UserManagementClient";

export default async function FinanceUsersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/users");

  const [{ data: profile }, { data: member }] = await Promise.all([
    supabase.from("profiles").select("role,active").eq("id", user.id).maybeSingle(),
    supabase.from("procurement_members").select("active").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!profile?.active || profile.role !== "super_admin" || !member?.active) redirect("/");

  const { data: users } = await supabase.from("procurement_members")
    .select("user_id,email,full_name,workflow_role,active").eq("active",true).not("user_id","is",null).order("full_name");

  return <UserManagementClient currentUserId={user.id} users={users ?? []} />;
}