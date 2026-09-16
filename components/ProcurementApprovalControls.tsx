import { approveProcurementRequest, verifyProcurementRequest, returnProcurementRequest, rejectProcurementRequest } from "@/app/actions/procurement";

export default function ProcurementApprovalControls({ requestId, status, workflowRole }: { requestId: string; status: string; workflowRole: string | null }) {
  const action = workflowRole === "verifier" && ["submitted","under_review"].includes(status) ? "verify" : workflowRole === "final_approver" && status === "verified" ? "approve" : null;
  if (!action) return null;
  const isVerifier = action === "verify";
  return <section className="rounded-2xl border-2 border-[#d8c77a] bg-[#fffdf5] p-6 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-widest text-[#006b3c]">{isVerifier?"STEP 1 OF 2 · VERIFICATION & RECOMMENDATION":"STEP 2 OF 2 · FINAL APPROVAL"}</p>
    <h2 className="mt-2 text-2xl font-bold">{isVerifier?"Action required: review and recommend":"Action required: make the final decision"}</h2>
    <p className="mt-2 text-sm leading-6 text-gray-600">{isVerifier?"Review the request details and items above. Record your comment, justification and recommendation, then send this request directly to the Final Approver.":"Review the original request and the Verifier's recommendation. Give final approval, return it for correction, or reject it. Approved requests proceed to Finance/Disbursement for payment execution."}</p>
    <div className="mt-4 rounded-lg bg-white p-4 text-sm font-semibold text-[#063d28]">Workflow: Manager/Requester → Verifier → Final Approver → Finance/Disbursement</div>
    <form className="mt-5 grid gap-3"><input type="hidden" name="request_id" value={requestId}/><label className="text-sm font-bold" htmlFor="review-note">{isVerifier?"Comment / Justification / Recommendation":"Final approval comment"}</label><textarea id="review-note" name="note" required={isVerifier} className="input min-h-32" placeholder={isVerifier?"State what you checked, relevant justification, and whether you recommend approval…":"Record any final approval comment or condition…"}/><div className="flex flex-wrap gap-3">
      <button formAction={isVerifier?verifyProcurementRequest:approveProcurementRequest} className={`rounded-lg px-6 py-3 font-bold ${isVerifier?"bg-[#006b3c] text-white":"bg-[#FDB515] text-[#172016]"}`}>{isVerifier?"Recommend & Send for Final Approval →":"Give Final Approval →"}</button>
      <button formAction={returnProcurementRequest} className="rounded-lg border border-amber-600 bg-white px-5 py-3 font-bold text-amber-800">Return for Correction</button>
      <button formAction={rejectProcurementRequest} className="rounded-lg border border-red-700 bg-white px-5 py-3 font-bold text-red-700">Reject Request</button>
    </div><p className="text-xs text-gray-500">After you submit, you return to your request dashboard. Another request will not open automatically. The next responsible role is notified by email.</p></form>
  </section>;
}
