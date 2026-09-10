"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
async function signedIn() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const { data: profile } = await supabase.from("profiles").select("id,role,active").eq("id", user.id).single();
  if (!profile || profile.active === false) throw new Error("Your account is not active.");
  return { supabase, user, profile };
}

export async function createProcurementRequest(formData: FormData) {
  const { supabase } = await signedIn();
  const itemNames = formData.getAll("item_name").map(String);
  const descriptions = formData.getAll("item_description").map(String);
  const quantities = formData.getAll("quantity").map(Number);
  const units = formData.getAll("unit").map(String);
  const unitCosts = formData.getAll("unit_cost").map(Number);
  const items = itemNames.map((item_name, index) => ({ item_name: item_name.trim(), description: (descriptions[index] ?? "").trim(), quantity: quantities[index], unit: (units[index] ?? "").trim(), unit_cost: unitCosts[index] })).filter((item) => item.item_name && Number.isFinite(item.quantity) && item.quantity > 0 && Number.isFinite(item.unit_cost) && item.unit_cost >= 0);
  if (!text(formData, "purpose")) throw new Error("Purpose is required.");
  if (items.length === 0) throw new Error("Add at least one valid item.");
  const { data, error } = await supabase.rpc("fn_create_procurement_request", {
    p_request_type: text(formData, "request_type") || "procurement", p_request_date: text(formData, "request_date") || new Date().toISOString().slice(0, 10),
    p_from_whom: text(formData, "from_whom"), p_to_whom: text(formData, "to_whom"), p_department: text(formData, "department"), p_purpose: text(formData, "purpose"),
    p_justification: text(formData, "justification"), p_required_by: text(formData, "required_by") || null, p_items: items, p_submit: true,
  });
  if (error) throw new Error(error.message);
  redirect(`/procurement/${data}`);
}

export async function verifyProcurementRequest(formData: FormData) {
  const { supabase, user, profile } = await signedIn();
  if (profile.role !== "admin") throw new Error("Only an administrator can verify requests.");
  const id = text(formData, "request_id");
  const { error } = await supabase.from("procurement_requests").update({ status: "verified", verified_by: user.id, verified_at: new Date().toISOString(), verification_note: text(formData,"note") || null }).eq("id", id).in("status", ["submitted","under_review"]);
  if (error) throw new Error(error.message);
  revalidatePath(`/procurement/${id}`); revalidatePath("/procurement");
}

export async function approveProcurementRequest(formData: FormData) {
  const { supabase, user, profile } = await signedIn();
  if (profile.role !== "admin") throw new Error("Only an administrator can approve requests.");
  const id = text(formData, "request_id");
  const { error } = await supabase.from("procurement_requests").update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString(), approval_note: text(formData,"note") || null }).eq("id", id).eq("status", "verified");
  if (error) throw new Error(error.message);
  revalidatePath(`/procurement/${id}`); revalidatePath("/procurement");
}
