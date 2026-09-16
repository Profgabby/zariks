import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 });

export default async function ProcurementPage({searchParams}:{searchParams:Promise<{result?:string}>}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const {result}=await searchParams;
  const { data: member } = await supabase.from("procurement_members").select("workflow_role,active").eq("user_id",user.id).maybeSingle();
  const role = member?.active ? member.workflow_role : "requester";
  const config:Record<string,{title:string;subtitle:string;statuses:string[];button:string}>={
    verifier:{title:"Requests Awaiting Your Review",subtitle:"Open a request when you are ready to verify it and record your recommendation for Final Approval.",statuses:["submitted","under_review"],button:"Review Request"},
    final_approver:{title:"Requests Awaiting Final Approval",subtitle:"These requests have completed verification and recommendation and now require your final decision.",statuses:["verified"],button:"Open for Final Approval"},
    finance_officer:{title:"Approved Requests Awaiting Disbursement",subtitle:"Final approval is complete. Open an approved request to record the actual payment/disbursement and supporting evidence.",statuses:["approved"],button:"Process Disbursement"}
  };
  const reviewer=config[role];
  let query=supabase.from("procurement_requests").select("id,request_no,request_type,request_date,purpose,to_whom,total_amount,status,created_at").order("created_at",{ascending:false});
  if(reviewer) query=query.in("status",reviewer.statuses); else query=query.eq("requested_by",user.id);
  const {data:requests}=await query;
  const messages:Record<string,string>={recommended:"Recommendation submitted successfully and sent for Final Approval.",approved:"Final approval recorded successfully. The request has been sent to Finance/Disbursement for payment processing.",returned:"Request returned for correction.",rejected:"Request rejected and the requester has been notified."};
  return <main className="min-h-screen bg-[#f5f7f5] px-5 py-8 text-[#152019]"><div className="mx-auto max-w-6xl">
    <Link href="/" className="text-sm font-semibold text-[#006b3c] hover:underline">← Dashboard</Link>
    {result&&messages[result]&&<div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-900">✓ {messages[result]}</div>}
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-[#006b3c]">Cashflow Control</p><h1 className="mt-1 text-3xl font-bold">{reviewer?reviewer.title:"My Money & Procurement Requests"}</h1><p className="mt-2 text-gray-500">{reviewer?reviewer.subtitle:"Create and track requests you have submitted."}</p></div>{!reviewer&&<Link href="/procurement/new" className="rounded-lg bg-[#FDB515] px-6 py-3 text-center font-bold text-[#172016] shadow-sm">+ New Request</Link>}</div>
    {reviewer&&<div className="mt-7 rounded-2xl bg-[#063d28] p-6 text-white"><p className="text-sm text-green-100">Current queue</p><p className="mt-1 text-4xl font-bold text-[#FDB515]">{requests?.length??0}</p><p className="mt-1 font-semibold">{role==="finance_officer"?"Approved requests awaiting payment/disbursement":"Requests awaiting your action"}</p><p className="mt-3 text-sm text-green-100">No request opens automatically. Choose the specific request you want to work on.</p></div>}
    <div className="mt-7 grid gap-4">{(requests??[]).map(r=><article key={r.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[#006b3c]">{r.request_no}</p><h2 className="mt-1 text-lg font-bold">{r.purpose}</h2><p className="mt-1 text-sm text-gray-500">{r.request_date} · {String(r.request_type).replaceAll("_"," ")} · {r.to_whom||"No beneficiary specified"}</p></div><div className="sm:text-right"><p className="text-xl font-bold">{ngn.format(Number(r.total_amount))}</p><p className="mt-1 text-sm capitalize text-gray-500">{String(r.status).replaceAll("_"," ")}</p><Link href={`/procurement/${r.id}`} className="mt-3 inline-block rounded-lg bg-[#006b3c] px-5 py-2.5 font-bold text-white">{reviewer?reviewer.button:"Open Request"} →</Link></div></div></article>)}{!requests?.length&&<div className="rounded-xl border bg-white p-10 text-center text-gray-500">{reviewer?"No requests are waiting for your action.":"You have not submitted any requests yet."}</div>}</div>
  </div></main>;
}
