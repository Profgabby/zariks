"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function generateScheduledPayment(formData: FormData) {
  const scheduleId = String(formData.get("schedule_id") ?? "").trim();
  if (!scheduleId) throw new Error("Payment schedule is required.");
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const { data: transferId, error } = await supabase.rpc("fn_generate_scheduled_payment", { p_schedule_id: scheduleId });
  if (error) throw new Error(error.message);
  revalidatePath("/payroll");
  revalidatePath("/transfers");
  revalidatePath("/");
  redirect(`/transfers/${transferId}`);
}
