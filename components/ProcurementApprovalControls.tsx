import { approveProcurementRequest, financeReviewProcurementRequest, verifyProcurementRequest, returnProcurementRequest, rejectProcurementRequest } from "@/app/actions/procurement";

export default function ProcurementApprovalControls({ requestId, status, workflowRole }: { requestId: string; status: string; workflowRole: string | null }) {
  const action = workflowRole === "verifier" && ["submitted","under_review"].includes(status) ? "verify"
    : workflowRole === "finance_officer" && status === "verified" ? "finance"
    : workflowRole === "final_approver" && status === "finance_reviewed" ? "approve" : null;
  if (!action) return null;
  const config = action === "verify"
    ? { step:"STEP 1 OF 3 · DIBIA", title:"Review this request and make a recommendation", help:"Check the request details and items above. Add your comment, justification or recommendation below. If acceptable, submit it to Sr. Bola for Finance Review.", placeholder:"Enter your comment, justification and recommendation for approval…", label:"Recommend & Send to Sr. Bola →", fn:verifyProcurementRequest, cls:"bg-[#006b3c] text-white", next:"Next: Sr. Bola reviews the financial details. If she forwards it, the request goes to Gabriel for final approval." }
    : action === "finance"
    ? { step:"STEP 2 OF 3 · SR. BOLA", title:"Finance review and recommendation", help:"Review the request amount, supporting details and Dibia's verification. Add your finance comment and recommendation below.", placeholder:"Enter Finance review, justification and recommendation…", label:"Recommend & Send for Final Approval →", fn:financeReviewProcurementRequest, cls:"bg-[#063d28] text-white", next:"Next: Gabriel receives this single request for final approval." }
    : { step:"STEP 3 OF 3 · FINAL APPROVAL", title:"Final decision", help:"Review the original request together with the preceding verification and Finance review, then record the final decision.", placeholder:"Enter final approval comment / justification…", label:"Give Final Approval", fn:approveProcurementRequest, cls:"bg-[#FDB515] text-[#172016]", next:"Approval completes the three-stage authorization route and moves the request to payment/disbursement." };
  return <section className="rounded-2xl border-2 border-[#d8c77a] bg-[#fffdf5] p-6 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-widest text-[#006b3c]">{config.step}</p><h2 className="mt-2 text-2xl font-bold">Action required: {config.title}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{config.help}</p>
    <div className="mt-4 rounded-lg bg-white p-4 text-sm font-semibold text-[#063d28]">Workflow: Dibia verification → Sr. Bola finance review → Gabriel final approval</div>
    <form className="mt-5 grid gap-3"><input type="hidden" name="request_id" value={requestId}/><label className="text-sm font-bold" htmlFor="review-note">Comment / Justification / Recommendation</label><textarea id="review-note" name="note" className="input min-h-32" placeholder={config.placeholder}/><div className="flex flex-wrap gap-3">
      <button formAction={config.fn} className={`rounded-lg px-6 py-3 font-bold ${config.cls}`}>{config.label}</button>
      <button formAction={returnProcurementRequest} className="rounded-lg border border-amber-600 bg-white px-5 py-3 font-bold text-amber-800">Return for Correction</button>
      <button formAction={rejectProcurementRequest} className="rounded-lg border border-red-700 bg-white px-5 py-3 font-bold text-red-700">Reject Request</button>
    </div><p className="text-xs text-gray-500">{config.next} A reason is required when returning or rejecting.</p></form>
  </section>;
}
