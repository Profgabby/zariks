"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function createDisbursementFromProcurement(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) throw new Error("Missing procurement request.");

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data: member } = await supabase.from("procurement_members").select("workflow_role,active").eq("user_id", user.id).maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("role,active").eq("id", user.id).maybeSingle();
  if (!profile?.active || !member?.active || !["finance_officer","final_approver"].includes(member.workflow_role)) {
    throw new Error("Only Finance or the Final Approver can record a disbursement from an approved request.");
  }

  const { data: request, error: requestError } = await supabase.from("procurement_requests")
    .select("id,request_no,status,total_amount,purpose,to_whom,final_approved_by,final_approved_at")
    .eq("id", requestId).single();
  if (requestError || !request) throw new Error("Procurement request not found.");
  if (request.status !== "approved" || !request.final_approved_by || !request.final_approved_at) {
    throw new Error("This request must receive Gabriel Ayayia's final approval before a payment/disbursement can be created.");
  }

  const { data: existing } = await supabase.from("transfers").select("id,transaction_no").eq("procurement_request_id", requestId).maybeSingle();
  if (existing) redirect(`/transfers/${existing.id}`);

  const { data: entities, error: entityError } = await supabase.from("entities").select("id,name").in("name", ["ZARI","Mediatrix Consulting Services Ltd","Bello Foods Nigeria Ltd"]);
  if (entityError) throw new Error(entityError.message);
  const zari = entities?.find((e) => e.name === "ZARI");
  const mediatrix = entities?.find((e) => e.name === "Mediatrix Consulting Services Ltd");
  const bello = entities?.find((e) => e.name === "Bello Foods Nigeria Ltd");
  if (!zari || !mediatrix || !bello) throw new Error("Required ZARIKS transfer entities are not configured.");

  const { data: transfer, error: transferError } = await supabase.from("transfers").insert({
    procurement_request_id: request.id,
    requester_id: user.id,
    sender_entity_id: zari.id,
    receiver_entity_id: mediatrix.id,
    operational_certifier_entity_id: bello.id,
    purpose_category: "approved_procurement",
    description: `${request.request_no}: ${request.purpose}${request.to_whom ? ` — Payee/recipient: ${request.to_whom}` : ""}`,
    project_reference: request.request_no,
    amount_requested: request.total_amount,
    amount_approved: request.total_amount,
    approved_at: request.final_approved_at,
    status: "approved",
  }).select("id,transaction_no").single();
  if (transferError || !transfer) throw new Error(transferError?.message ?? "Could not create the disbursement record.");

  await supabase.from("audit_events").insert({
    transfer_id: transfer.id,
    actor_id: user.id,
    event_type: "disbursement_created_from_procurement",
    description: `${transfer.transaction_no} created from finally approved procurement request ${request.request_no}.`,
    metadata: { procurement_request_id: request.id, procurement_request_no: request.request_no, approved_amount: request.total_amount }
  });

  revalidatePath(`/procurement/${requestId}`);
  revalidatePath("/procurement");
  revalidatePath("/transfers");
  revalidatePath("/");
  redirect(`/transfers/${transfer.id}`);
}
