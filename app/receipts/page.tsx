import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ReceiptUploadForm from "@/components/ReceiptUploadForm";
export default async function ReceiptsPage(){
 const supabase=await createServerSupabaseClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login?next=/receipts");
 const {data:member}=await supabase.from("procurement_members").select("active").eq("user_id",user.id).maybeSingle();
 if(!member?.active) redirect("/login");
 const {data:transfers}=await supabase.from("transfers").select("id,transaction_no,description,payee_name,amount_transferred,status,approved_obligation_id,approved_obligations(request_no,approved_amount,purpose)").in("status",["transferred","received","certified","retirement_submitted","reconciled","closed"]).order("created_at",{ascending:false});
 const {data:receipts}=await supabase.from("expense_receipts").select("id,transfer_id,receipt_number,vendor_name,purchase_date,amount,file_name,status,created_at").order("created_at",{ascending:false});
 const sums=new Map<string,number>(); for(const r of receipts||[]) if(r.status!=="returned") sums.set(r.transfer_id,(sums.get(r.transfer_id)||0)+Number(r.amount));
 return <main className="min-h-screen bg-[#f5f7f5] p-6"><div className="mx-auto max-w-6xl space-y-6"><div><Link href="/" className="text-sm font-semibold text-[#006b3c]">← Dashboard</Link><h1 className="mt-2 text-3xl font-bold">Receipts & Expense Evidence</h1><p className="mt-1 text-sm text-gray-600">Upload proof of purchases and expenditure after funds are disbursed.</p></div><ReceiptUploadForm transfers={(transfers||[]).map(t=>({...t,supported:sums.get(t.id)||0}))}/><section className="rounded-xl border bg-white p-6"><h2 className="text-lg font-bold">Submitted evidence</h2>{!receipts?.length?<p className="mt-4 text-sm text-gray-500">No expense receipts have been uploaded yet.</p>:<div className="mt-4 space-y-3">{receipts.map(r=><div key={r.id} className="flex flex-wrap justify-between gap-3 rounded-lg border p-4"><div><p className="font-semibold">{r.vendor_name}</p><p className="text-xs text-gray-500">{r.purchase_date} · {r.receipt_number||"No receipt number"} · {r.file_name}</p></div><div className="text-right"><p className="font-bold">₦{Number(r.amount).toLocaleString()}</p><p className="text-xs capitalize">{r.status.replaceAll("_"," ")}</p></div></div>)}</div>}</section></div></main>
}
