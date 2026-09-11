import { approveProcurementRequest, financeReviewProcurementRequest, verifyProcurementRequest, returnProcurementRequest, rejectProcurementRequest } from "@/app/actions/procurement";

export default function ProcurementApprovalControls({ requestId, status, workflowRole }: { requestId: string; status: string; workflowRole: string | null }) {
  const action = workflowRole === "verifier" && ["submitted","under_review"].includes(status) ? "verify"
    : workflowRole === "finance_officer" && status === "verified" ? "finance"
    : workflowRole === "final_approver" && status === "finance_reviewed" ? "approve" : null;
  if (!action) return null;
  const config = action === "verify"
    ? { title:"Operations / Admin Verification", help:"Verify the request before it proceeds to Finance. Dibia may also return it to Hadiza or reject it.", placeholder:"Verification / return / rejection note", label:"Verify & Forward to Finance", fn:verifyProcurementRequest, cls:"bg-[#006b3c] text-white" }
    : action === "finance"
    ? { title:"Finance Review", help:"Review the amount and financial details. Bola may forward it to final approval, return it to Hadiza, or reject it.", placeholder:"Finance / return / rejection note", label:"Complete Review & Forward", fn:financeReviewProcurementRequest, cls:"bg-[#063d28] text-white" }
    : { title:"Final Approval", help:"Final approval is reserved for Gabriel Ayayia. You may approve, return for correction, or reject.", placeholder:"Final approval / return / rejection note", label:"Give Final Approval", fn:approveProcurementRequest, cls:"bg-[#FDB515] text-[#172016]" };
  return <section className="rounded-xl border border-[#d8c77a] bg-[#fffdf5] p-5">
    <h2 className="font-bold">{config.title}</h2><p className="mt-1 text-sm text-gray-600">{config.help}</p>
    <form className="mt-4 grid gap-3"><input type="hidden" name="request_id" value={requestId}/><textarea name="note" className="input min-h-24" placeholder={config.placeholder}/><div className="flex flex-wrap gap-3">
      <button formAction={config.fn} className={`rounded-lg px-5 py-3 font-bold ${config.cls}`}>{config.label}</button>
      <button formAction={returnProcurementRequest} className="rounded-lg border border-amber-600 bg-white px-5 py-3 font-bold text-amber-800">Return for Correction</button>
      <button formAction={rejectProcurementRequest} className="rounded-lg border border-red-700 bg-white px-5 py-3 font-bold text-red-700">Reject Request</button>
    </div><p className="text-xs text-gray-500">A reason is required when returning or rejecting a request. The next responsible person is assigned automatically and an email notification is queued.</p></form>
  </section>;
}
