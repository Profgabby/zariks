import Link from "next/link";
import { redirect } from "next/navigation";
import ProcurementRequestForm from "@/components/ProcurementRequestForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function NewProcurementPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <main className="min-h-screen bg-[#f5f7f5] px-5 py-8 text-[#152019]">
    <div className="mx-auto max-w-5xl">
      <Link href="/procurement" className="text-sm font-semibold text-[#006b3c] hover:underline">← Money & Procurement Requests</Link>
      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-bold uppercase tracking-wider text-[#006b3c]">Cashflow Control</p>
        <h1 className="mt-2 text-3xl font-bold">New Money / Procurement Request</h1>
        <p className="mb-8 mt-2 text-gray-500">Enter the request details, itemize the cost in Naira, and submit it for verification and approval.</p>
        <ProcurementRequestForm />
      </div>
    </div>
  </main>;
}
