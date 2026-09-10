import Link from "next/link";

export default function ProcurementShortcut() {
  return <div className="rounded-xl border border-[#d8c77a] bg-[#fffdf5] p-6 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-wider text-[#006b3c]">Cashflow</p>
    <h3 className="mt-2 text-xl font-bold text-[#152019]">Money / Procurement Request</h3>
    <p className="mt-2 text-sm text-gray-600">Itemize a request in Naira and route it through Requested By, Verified By and Approved By.</p>
    <div className="mt-5 flex flex-wrap gap-3"><Link href="/procurement/new" className="rounded-lg bg-[#FDB515] px-4 py-2 text-sm font-bold text-[#172016]">+ New Request</Link><Link href="/procurement" className="rounded-lg border border-[#006b3c] px-4 py-2 text-sm font-bold text-[#006b3c]">View Requests</Link></div>
  </div>;
}
