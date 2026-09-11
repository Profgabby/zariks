import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 });

export default async function ProcurementPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requests } = await supabase.from("procurement_requests").select("id,request_no,request_type,request_date,purpose,to_whom,total_amount,status").order("created_at", { ascending: false });

  return <main className="min-h-screen bg-[#f5f7f5] px-5 py-8 text-[#152019]">
    <div className="mx-auto max-w-7xl">
      <Link href="/" className="text-sm font-semibold text-[#006b3c] hover:underline">← Dashboard</Link>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold uppercase tracking-wider text-[#006b3c]">Cashflow Control</p><h1 className="mt-1 text-3xl font-bold">Money & Procurement Requests</h1><p className="mt-2 text-gray-500">Requests, verification and approval before cash is paid or procurement is completed.</p></div>
        <Link href="/procurement/new" className="rounded-lg bg-[#FDB515] px-6 py-3 text-center font-bold text-[#172016] shadow-sm">+ New Request</Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#063d28] text-white"><tr><th className="p-4">Request No.</th><th className="p-4">Date</th><th className="p-4">Type</th><th className="p-4">For What?</th><th className="p-4">To Whom</th><th className="p-4 text-right">Total</th><th className="p-4">Status</th></tr></thead><tbody>
          {(requests ?? []).map((r) => <tr key={r.id} className="border-t"><td className="p-4 font-bold text-[#006b3c]"><Link href={`/procurement/${r.id}`}>{r.request_no}</Link></td><td className="p-4">{r.request_date}</td><td className="p-4 capitalize">{String(r.request_type).replaceAll("_"," ")}</td><td className="p-4">{r.purpose}</td><td className="p-4">{r.to_whom || "—"}</td><td className="p-4 text-right font-bold">{ngn.format(Number(r.total_amount))}</td><td className="p-4 capitalize">{String(r.status).replaceAll("_"," ")}</td></tr>)}
          {!requests?.length && <tr><td colSpan={7} className="p-10 text-center text-gray-500">No requests yet. Create the first money or procurement request.</td></tr>}
        </tbody></table></div>
      </div>
    </div>
  </main>;
}
