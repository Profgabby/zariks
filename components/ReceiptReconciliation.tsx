"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

type Obligation = {
  id: string;
  request_no: string;
  approved_amount: number;
  purpose: string;
  beneficiary: string | null;
  status: string;
  disbursed_amount: number;
  accepted_receipts: number;
  returned_cash: number;
};

type Receipt = {
  id: string;
  approved_obligation_id: string | null;
  receipt_number: string | null;
  vendor_name: string;
  purchase_date: string;
  amount: number;
  file_name: string;
  storage_path: string;
  status: string;
  review_notes: string | null;
};

type Transfer = {
  id: string;
  approved_obligation_id: string | null;
};

type CashReturn = {
  id: string;
  approved_obligation_id: string;
  amount: number;
};

const money = (value: number) =>
  "₦" + Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 });

export default function ReceiptReconciliation({
  obligations,
  receipts,
  returns,
  transfers,
  canReview,
}: {
  obligations: Obligation[];
  receipts: Receipt[];
  returns: CashReturn[];
  transfers: Transfer[];
  canReview: boolean;
}) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function review(receiptId: string, decision: "accepted" | "returned") {
    let notes: string | null = null;
    if (decision === "returned") {
      notes = window.prompt("Reason for correction / return:")?.trim() || null;
      if (!notes) return;
    }
    setBusy(receiptId);
    const { error } = await supabase.rpc("review_expense_receipt", {
      p_receipt_id: receiptId,
      p_decision: decision,
      p_notes: notes,
    });
    if (error) {
      setMessage(error.message);
      setBusy("");
      return;
    }
    window.location.reload();
  }

  async function openEvidence(path: string) {
    const { data, error } = await supabase.storage
      .from("transfer-evidence")
      .createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      setMessage(error?.message || "Unable to open evidence.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function recordReturn(obligation: Obligation) {
    const raw = window.prompt("Amount of cash returned:");
    if (!raw) return;
    const amount = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) return;
    const reference = window.prompt("Return/payment reference (optional):") || null;
    const transfer = transfers.find((item) => item.approved_obligation_id === obligation.id);

    setBusy(obligation.id);
    const { error } = await supabase.rpc("record_cash_return", {
      p_obligation_id: obligation.id,
      p_transfer_id: transfer?.id || null,
      p_amount: amount,
      p_reference: reference,
      p_notes: null,
    });
    if (error) {
      setMessage(error.message);
      setBusy("");
      return;
    }
    window.location.reload();
  }

  async function reconcile(obligationId: string) {
    setBusy(obligationId);
    const { error } = await supabase.rpc("reconcile_approved_obligation", {
      p_obligation_id: obligationId,
    });
    if (error) {
      setMessage(error.message);
      setBusy("");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {message}
        </div>
      ) : null}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Approved Money Accountability</h2>
        <p className="mt-1 text-sm text-gray-500">
          Approved → Disbursed → Accepted receipts → Returned cash → Outstanding.
        </p>

        {obligations.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            No finally approved obligations yet.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {obligations.map((obligation) => {
              const outstanding = Math.max(
                0,
                Number(obligation.disbursed_amount) -
                  Number(obligation.accepted_receipts) -
                  Number(obligation.returned_cash)
              );
              const pending = receipts.filter(
                (receipt) =>
                  receipt.approved_obligation_id === obligation.id &&
                  (receipt.status === "submitted" || receipt.status === "under_review")
              ).length;

              return (
                <article key={obligation.id} className="rounded-xl border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-[#006b3c]">
                        {obligation.request_no}
                      </div>
                      <h3 className="mt-1 font-bold">{obligation.purpose}</h3>
                      <p className="text-xs text-gray-500">
                        {obligation.beneficiary || "No beneficiary recorded"} ·{" "}
                        {obligation.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    {obligation.status === "reconciled" ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                        RECONCILED
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                    <Metric label="Approved" value={money(obligation.approved_amount)} />
                    <Metric label="Disbursed" value={money(obligation.disbursed_amount)} />
                    <Metric label="Accepted receipts" value={money(obligation.accepted_receipts)} />
                    <Metric label="Returned cash" value={money(obligation.returned_cash)} />
                    <Metric label="Outstanding" value={money(outstanding)} strong={outstanding > 0} />
                  </div>

                  {canReview && obligation.status !== "reconciled" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => recordReturn(obligation)}
                        disabled={busy === obligation.id}
                        className="rounded-lg border border-[#006b3c] px-4 py-2 text-sm font-bold text-[#006b3c]"
                      >
                        Record returned cash
                      </button>
                      <button
                        type="button"
                        onClick={() => reconcile(obligation.id)}
                        disabled={
                          busy === obligation.id ||
                          outstanding > 0 ||
                          pending > 0 ||
                          Number(obligation.disbursed_amount) <= 0
                        }
                        className="rounded-lg bg-[#006b3c] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Reconcile & close accountability
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Receipt Review Queue</h2>
        <p className="mt-1 text-sm text-gray-500">
          Authorized Finance reviewers accept evidence or return it for correction.
        </p>

        {receipts.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">No receipts uploaded yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Evidence</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Review</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-t">
                    <td className="p-3">{receipt.purchase_date}</td>
                    <td className="p-3">
                      <b>{receipt.vendor_name}</b>
                      <div className="text-xs text-gray-500">
                        {receipt.receipt_number || "No receipt number"}
                      </div>
                    </td>
                    <td className="p-3 font-bold">{money(receipt.amount)}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEvidence(receipt.storage_path)}
                        className="font-semibold text-[#006b3c] underline"
                      >
                        {receipt.file_name}
                      </button>
                    </td>
                    <td className="p-3">
                      <span className="capitalize">{receipt.status.replaceAll("_", " ")}</span>
                      {receipt.review_notes ? (
                        <div className="max-w-xs text-xs text-red-700">{receipt.review_notes}</div>
                      ) : null}
                    </td>
                    <td className="p-3">
                      {canReview && receipt.status !== "accepted" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy === receipt.id}
                            onClick={() => review(receipt.id, "accepted")}
                            className="rounded bg-[#006b3c] px-3 py-2 text-xs font-bold text-white"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={busy === receipt.id}
                            onClick={() => review(receipt.id, "returned")}
                            className="rounded border border-red-300 px-3 py-2 text-xs font-bold text-red-700"
                          >
                            Return for correction
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <span className="hidden">{returns.length}</span>
    </div>
  );
}

function Metric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-3 " +
        (strong ? "border-amber-300 bg-amber-50" : "bg-gray-50")
      }
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-bold">{value}</div>
    </div>
  );
}
