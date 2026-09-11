import { approveProcurementRequest, financeReviewProcurementRequest, verifyProcurementRequest } from "@/app/actions/procurement";

export default function ProcurementApprovalControls({ requestId, status, workflowRole }: { requestId: string; status: string; workflowRole: string | null }) {
  const action = workflowRole === "verifier" && ["submitted","under_review"].includes(status) ? "verify"
    : workflowRole === "finance_officer" && status === "verified" ? "finance"
    : workflowRole === "final_approver" && status === "finance_reviewed" ? "approve" : null;
  if (!action) return null;
  const config = action === "verify"
    ? { title: "Operations / Admin Verification", help: "Verify the request before it proceeds to Finance.", placeholder: "Verification note (optional)", label: "Verify Request", fn: verifyProcurementRequest, cls: "bg-[#006b3c] text-white" }
    : action === "finance"
    ? { title: "Finance Review", help: "Review the amount and financial details before final approval.", placeholder: "Finance review note (optional)", label: "Complete Finance Review", fn: financeReviewProcurementRequest, cls: "bg-[#063d28] text-white" }
    : { title: "Final Approval", help: "Final approval is reserved for Gabriel Ayayia.", placeholder: "Final approval note (optional)", label: "Give Final Approval", fn: approveProcurementRequest, cls: "bg-[#FDB515] text-[#172016]" };
  return <section className="rounded-xl border border-[#d8c77a] bg-[#fffdf5] p-5"><h2 className="font-bold">{config.title}</h2><p className="mt-1 text-sm text-gray-600">{config.help}</p><form action={config.fn} className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="request_id" value={requestId} /><input name="note" className="input" placeholder={config.placeholder} /><button className={`whitespace-nowrap rounded-lg px-5 py-3 font-bold ${config.cls}`}>{config.label}</button></form></section>;
}
