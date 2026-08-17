"use client";

import { useActionState } from "react";

import {
  createTransferRequest,
} from "@/app/actions/transfers";

import {
  INITIAL_TRANSFER_STATE,
} from "@/lib/transfer-state";

export default function NewTransferForm() {
  const [
    state,
    action,
    pending,
  ] = useActionState(
    createTransferRequest,
    INITIAL_TRANSFER_STATE
  );

  return (
    <form
      action={action}
      className="space-y-5"
    >
      <div>
        <label className="mb-2 block text-sm font-semibold">
          Invoice Number
        </label>

        <input
          name="invoice_no"
          placeholder="e.g. MED-INV-001"
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Amount Requested (₦)
        </label>

        <input
          name="amount_requested"
          type="number"
          min="1"
          step="0.01"
          required
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Purpose
        </label>

        <select
          name="purpose_category"
          required
          className="w-full rounded-lg border px-4 py-3"
        >
          <option value="">
            Select purpose
          </option>

          <option value="equipment">
            Equipment
          </option>

          <option value="raw_materials">
            Raw Materials
          </option>

          <option value="production_processing">
            Production & Processing
          </option>

          <option value="packaging">
            Packaging Materials
          </option>

          <option value="transport_logistics">
            Transportation & Logistics
          </option>

          <option value="cold_storage">
            Cold Storage / Depot
          </option>

          <option value="salary_labour">
            Salary / Labour
          </option>

          <option value="marketing">
            Marketing
          </option>

          <option value="other">
            Other Operating Expense
          </option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Detailed Description
        </label>

        <textarea
          name="description"
          rows={5}
          required
          placeholder="Explain exactly what the transfer will fund..."
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div className="rounded-lg bg-green-50 p-4 text-sm">
        <p className="font-semibold">
          Fund Recipient
        </p>

        <p>
          Mediatrix Consulting Services Ltd
        </p>

        <p className="mt-3 font-semibold">
          Operational Certifier
        </p>

        <p>
          Bello Foods Nigeria Ltd
        </p>
      </div>

      {state.message && (
        <div
          className={`rounded-lg p-4 text-sm ${
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
        className="w-full rounded-lg bg-[#006b3c] px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending
          ? "Submitting..."
          : "Submit Transfer Request"}
      </button>
    </form>
  );
}