"use client";

import { useActionState } from "react";

import {
  approveTransfer,
} from "@/app/actions/transfers";

import {
  INITIAL_STATE,
} from "@/lib/transfer-state";

export default function ApproveTransferForm({
  transferId,
  requestedAmount,
}: {
  transferId: string;
  requestedAmount: number;
}) {
  const actionWithId = approveTransfer.bind(
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
          Amount Approved (₦)
        </label>

        <input
          name="amount_approved"
          type="number"
          step="0.01"
          min="1"
          defaultValue={requestedAmount}
          required
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Approval Comments
        </label>

        <textarea
          name="comments"
          rows={3}
          placeholder="Optional approval comments..."
          className="w-full rounded-lg border px-4 py-3"
        />
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
          ? "Approving..."
          : "Approve Transfer"}
      </button>
    </form>
  );
}