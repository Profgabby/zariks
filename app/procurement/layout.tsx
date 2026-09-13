import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isApprovedZariksEmail } from "@/lib/zariks-users";

export default async function ProcurementLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/procurement");
  if (!isApprovedZariksEmail(user.email)) redirect("/login");

  const { data: member } = await supabase
    .from("procurement_members")
    .select("active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member?.active) redirect("/login");
  return children;
}
