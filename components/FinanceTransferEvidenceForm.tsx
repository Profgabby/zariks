"use client";

import { useActionState } from "react";

import {
  recordTransferPayment,
} from "@/app/actions/transfers";

import {
  INITIAL_STATE,
} from "@/lib/transfer-state";

export default function FinanceTransferEvidenceForm({
  transferId,
  approvedAmount,
}: {
  transferId: string;
  approvedAmount: number;
}) {
  const actionWithId = recordTransferPayment.bind(
    null,
    transferId
  );

  const [state, action, pending] = useActionState(
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
          Amount Transferred (₦)
        </label>

        <input
          name="amount"
          type="number"
          step="0.01"
          min="1"
          defaultValue={approvedAmount}
          required
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Transfer Date
        </label>

        <input
          name="payment_date"
          type="date"
          required
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Bank Transaction Reference
        </label>

        <input
          name="bank_reference"
          required
          placeholder="e.g. TRX-2026-000123"
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Sending Bank
          </label>

          <input
            name="sender_bank"
            placeholder="e.g. Access Bank"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Receiving Bank
          </label>

          <input
            name="receiver_bank"
            placeholder="e.g. Zenith Bank"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>
      </div>

      <input
        type="hidden"
        name="payment_method"
        value="bank_transfer"
      />

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Upload Bank Transfer Proof
        </label>

        <input
          name="evidence"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          required
          className="w-full rounded-lg border px-4 py-3"
        />

        <p className="mt-1 text-xs text-gray-500">
          Allowed: PDF, JPG, JPEG or PNG. Maximum 10 MB.
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
          ? "Recording transfer..."
          : "Record Transfer & Upload Evidence"}
      </button>
    </form>
  );
}