import Link from "next/link";
import {redirect} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase-server";
import ReceiptUploadForm from "@/components/ReceiptUploadForm";
import ReceiptReconciliation from "@/components/ReceiptReconciliation";

export default async function ReceiptsPage(){
 const supabase=await createServerSupabaseClient();
 const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login?next=/receipts");
 const [{data:member},{data:profile}]=await Promise.all([
  supabase.from("procurement_members").select("active,workflow_role").eq("user_id",user.id).maybeSingle(),
  supabase.from("profiles").select("role").eq("id",user.id).maybeSingle()
 ]);
 if(!member?.active)redirect("/login");
 const [{data:transfers},{data:receipts},{data:obligations},{data:returns}]=await Promise.all([
  supabase.from("transfers").select("id,transaction_no,description,payee_name,amount_transferred,status,approved_obligation_id").in("status",["transferred","received","certified","retirement_submitted","reconciled","closed"]).not("approved_obligation_id","is",null).order("created_at",{ascending:false}),
  supabase.from("expense_receipts").select("id,transfer_id,approved_obligation_id,receipt_number,vendor_name,purchase_date,amount,description,file_name,storage_path,status,review_notes,created_at").order("created_at",{ascending:false}),
  supabase.from("obligation_accountability").select("*").order("final_approved_at",{ascending:false}),
  supabase.from("cash_returns").select("id,approved_obligation_id,transfer_id,amount,reference,notes,returned_at").order("returned_at",{ascending:false})
 ]);
 const supported=new Map<string,number>(); for(const r of receipts||[])if(r.status==="accepted")supported.set(r.transfer_id,(supported.get(r.transfer_id)||0)+Number(r.amount));
 const canReview=["admin","super_admin","finance"].includes(profile?.role||"");
 return <main className="min-h-screen bg-[#f5f7f5] p-6 text-[#152019]"><div className="mx-auto max-w-7xl space-y-6">
  <div><Link href="/" className="text-sm font-semibold text-[#006b3c]">← Dashboard</Link><h1 className="mt-2 text-3xl font-bold">Receipts & Expenses</h1><p className="mt-1 text-sm text-gray-600">Account for every disbursed naira with accepted evidence or returned cash.</p></div>
  <ReceiptReconciliation obligations={(obligations || []) as any} receipts={(receipts || []) as any} returns={(returns || []) as any} transfers={(transfers || []) as any} canReview={canReview}/>
  <ReceiptUploadForm transfers={(transfers||[]).map(t=>({...t,supported:supported.get(t.id)||0}))}/>
 </div></main>
