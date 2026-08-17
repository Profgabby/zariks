"use client";

import { useActionState } from "react";

import {
  confirmRecipientReceipt,
} from "@/app/actions/transfers";

import {
  INITIAL_STATE,
} from "@/lib/transfer-state";

export default function RecipientReceiptForm({
  transferId,
  expectedAmount,
}: {
  transferId: string;
  expectedAmount: number;
}) {
  const actionWithId =
    confirmRecipientReceipt.bind(
      null,
      transferId
    );

  const [
    state,
    action,
    pending,
  ] = useActionState(
    actionWithId,
    INITIAL_STATE
  );

  return (
    <form
      action={action}
      className="space-y-4"
    >
      <div>
        <label className="mb-2 block text-sm font-semibold">
          Amount Expected (₦)
        </label>

        <input
          value={expectedAmount}
          readOnly
          className="w-full rounded-lg border bg-gray-100 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Amount Actually Received (₦)
        </label>

        <input
          name="amount_received"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={expectedAmount}
          required
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Date Received
        </label>

        <input
          name="received_date"
          type="date"
          required
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Bank / Credit Reference
        </label>

        <input
          name="bank_reference"
          placeholder="Optional reference"
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Comments
        </label>

        <textarea
          name="comments"
          rows={3}
          placeholder="Optional comments, discrepancy or exception..."
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Upload Receipt / Acknowledgement
        </label>

        <input
          name="evidence"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          required
          className="w-full rounded-lg border px-4 py-3"
        />

        <p className="mt-1 text-xs text-gray-500">
          PDF, JPG, JPEG or PNG. Maximum 10 MB.
        </p>
      </div>

      {state.message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            state.ok
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#006b3c] px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending
          ? "Confirming..."
          : "Confirm Funds Received"}
      </button>
    </form>
  );
}