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
  const { data: membership } = await supabase.from("procurement_members").select("workflow_role,active").eq("user_id", user.id).single();
  return { supabase, user, profile, workflowRole: membership?.active ? membership.workflow_role : null };
}
function refresh(id: string) { revalidatePath(`/procurement/${id}`); revalidatePath("/procurement"); revalidatePath("/"); }
async function sendLatestNotification(supabase: any, requestId: string, eventType: string) {
  const { data: n } = await supabase.from("procurement_notifications").select("id").eq("request_id", requestId).eq("event_type", eventType).eq("delivery_status", "pending").order("created_at", {ascending:false}).limit(1).maybeSingle();
  if (n?.id) await supabase.functions.invoke("send-procurement-notification", { body: { notification_id: n.id } });
}

export async function createProcurementRequest(formData: FormData) {
  const { supabase, workflowRole } = await signedIn();
  if (workflowRole !== "requester" && workflowRole !== "final_approver") throw new Error("Only an authorized requester can submit procurement requests.");
  const itemNames = formData.getAll("item_name").map(String), descriptions = formData.getAll("item_description").map(String), quantities = formData.getAll("quantity").map(Number), units = formData.getAll("unit").map(String), unitCosts = formData.getAll("unit_cost").map(Number);
  const items = itemNames.map((item_name,index)=>({item_name:item_name.trim(),description:(descriptions[index]??"").trim(),quantity:quantities[index],unit:(units[index]??"").trim(),unit_cost:unitCosts[index]})).filter(i=>i.item_name&&Number.isFinite(i.quantity)&&i.quantity>0&&Number.isFinite(i.unit_cost)&&i.unit_cost>=0);
  if (!text(formData,"purpose")) throw new Error("Purpose is required.");
  if (!items.length) throw new Error("Add at least one valid item.");
  const { data, error } = await supabase.rpc("fn_create_procurement_request", {p_request_type:text(formData,"request_type")||"procurement",p_request_date:text(formData,"request_date")||new Date().toISOString().slice(0,10),p_from_whom:text(formData,"from_whom"),p_to_whom:text(formData,"to_whom"),p_department:text(formData,"department"),p_purpose:text(formData,"purpose"),p_justification:text(formData,"justification"),p_required_by:text(formData,"required_by")||null,p_items:items,p_submit:true});
  if (error) throw new Error(error.message);
  await sendLatestNotification(supabase, data, "verification_required");
  redirect(`/procurement/${data}`);
}

export async function verifyProcurementRequest(formData: FormData) {
  const { supabase,user,workflowRole }=await signedIn(); if(workflowRole!=="verifier") throw new Error("Only Dibia Emmanuel can verify this request.");
  const id=text(formData,"request_id"); const {error}=await supabase.from("procurement_requests").update({status:"verified",verified_by:user.id,verified_at:new Date().toISOString(),verification_note:text(formData,"note")||null}).eq("id",id).in("status",["submitted","under_review"]); if(error) throw new Error(error.message);
  await sendLatestNotification(supabase,id,"finance_review_required"); refresh(id);
}
export async function financeReviewProcurementRequest(formData: FormData) {
  const {supabase,user,workflowRole}=await signedIn(); if(workflowRole!=="finance_officer") throw new Error("Only Sr. Bola Daramola can complete finance review.");
  const id=text(formData,"request_id"); const {error}=await supabase.from("procurement_requests").update({status:"finance_reviewed",finance_reviewed_by:user.id,finance_reviewed_at:new Date().toISOString(),finance_review_note:text(formData,"note")||null}).eq("id",id).eq("status","verified"); if(error) throw new Error(error.message);
  await sendLatestNotification(supabase,id,"final_approval_required"); refresh(id);
}
export async function approveProcurementRequest(formData: FormData) {
  const {supabase,user,workflowRole}=await signedIn(); if(workflowRole!=="final_approver") throw new Error("Only Gabriel Ayayia can give final approval.");
  const id=text(formData,"request_id"),now=new Date().toISOString(),note=text(formData,"note")||null; const {error}=await supabase.from("procurement_requests").update({status:"approved",final_approved_by:user.id,final_approved_at:now,final_approval_note:note,approved_by:user.id,approved_at:now,approval_note:note}).eq("id",id).eq("status","finance_reviewed"); if(error) throw new Error(error.message);
  const {data:notes}=await supabase.from("procurement_notifications").select("id").eq("request_id",id).eq("event_type","final_approval_complete").eq("delivery_status","pending"); for(const n of notes??[]) await supabase.functions.invoke("send-procurement-notification",{body:{notification_id:n.id}}); refresh(id);
}
export async function returnProcurementRequest(formData: FormData) {
  const {supabase,user,workflowRole}=await signedIn(); if(!["verifier","finance_officer","final_approver"].includes(workflowRole??"")) throw new Error("You are not authorized to return this request.");
  const id=text(formData,"request_id"),note=text(formData,"note"); if(!note) throw new Error("A return reason is required.");
  const allowed=workflowRole==="verifier"?["submitted","under_review"]:workflowRole==="finance_officer"?["verified"]:["finance_reviewed"];
  const {error}=await supabase.from("procurement_requests").update({status:"returned_for_correction",returned_by:user.id,returned_at:new Date().toISOString(),return_note:note}).eq("id",id).in("status",allowed); if(error) throw new Error(error.message);
  await sendLatestNotification(supabase,id,"returned_for_correction"); refresh(id);
}
export async function rejectProcurementRequest(formData: FormData) {
  const {supabase,user,workflowRole}=await signedIn(); if(!["verifier","finance_officer","final_approver"].includes(workflowRole??"")) throw new Error("You are not authorized to reject this request.");
  const id=text(formData,"request_id"),note=text(formData,"note"); if(!note) throw new Error("A rejection reason is required.");
  const allowed=workflowRole==="verifier"?["submitted","under_review"]:workflowRole==="finance_officer"?["verified"]:["finance_reviewed"];
  const {error}=await supabase.from("procurement_requests").update({status:"rejected",rejected_by:user.id,rejected_at:new Date().toISOString(),rejection_note:note}).eq("id",id).in("status",allowed); if(error) throw new Error(error.message);
  await sendLatestNotification(supabase,id,"request_rejected"); refresh(id);
}
