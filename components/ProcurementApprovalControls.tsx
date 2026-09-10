import { approveProcurementRequest, verifyProcurementRequest } from "@/app/actions/procurement";

export default function ProcurementApprovalControls({ requestId, status, isAdmin }: { requestId: string; status: string; isAdmin: boolean }) {
  if (!isAdmin) return null;
  if (!["submitted","under_review","verified"].includes(status)) return null;
  return <section className="rounded-xl border border-[#d8c77a] bg-[#fffdf5] p-5">
    <h2 className="font-bold">Verification & Approval</h2>
    <p className="mt-1 text-sm text-gray-600">A request must be verified before it can be approved.</p>
    {status !== "verified" ? <form action={verifyProcurementRequest} className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="request_id" value={requestId} /><input name="note" className="input" placeholder="Verification note (optional)" /><button className="whitespace-nowrap rounded-lg bg-[#006b3c] px-5 py-3 font-bold text-white">Verify Request</button></form> : <form action={approveProcurementRequest} className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="request_id" value={requestId} /><input name="note" className="input" placeholder="Approval note (optional)" /><button className="whitespace-nowrap rounded-lg bg-[#FDB515] px-5 py-3 font-bold text-[#172016]">Approve Request</button></form>}
  </section>;
}
