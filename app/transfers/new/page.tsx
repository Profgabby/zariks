import Link from "next/link";
import NewTransferForm from "@/components/NewTransferForm";

export default function NewTransferPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f5] px-6 py-10">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/"
          className="text-sm font-semibold text-[#007a45] hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-gray-300 bg-white p-8 shadow-sm">

          <p className="text-sm font-bold uppercase tracking-wider text-[#007a45]">
            Finance & Disbursement
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            New Fund Transfer
          </h1>

          <p className="mt-2 mb-8 text-gray-500">
            Create a new auditable request for the transfer of ZARI funds.
          </p>

          <NewTransferForm />

        </div>
      </div>
    </main>
  );
}