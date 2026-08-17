import Link from "next/link";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase-server";

function formatMoney(
  amount: number | string | null
) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}

export default async function TransfersPage() {
  const supabase =
    await createServerSupabaseClient();

  // Check that the user is signed in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Load transfers from Supabase
  const {
    data: transfers,
    error,
  } = await supabase
    .from("transfers")
    .select(`
      id,
      transaction_no,
      invoice_no,
      purpose_category,
      description,
      amount_requested,
      amount_approved,
      amount_transferred,
      status,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="min-h-screen bg-[#f5f7f5] px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* TOP SECTION */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/"
              className="font-semibold text-[#006b3c]"
            >
              ← Back to Dashboard
            </Link>

            <p className="mt-6 text-sm font-bold uppercase tracking-wider text-[#006b3c]">
              Finance & Disbursement
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Fund Transfers
            </h1>

            <p className="mt-2 text-gray-500">
              Review transfer requests, approvals,
              payments and recipient confirmations.
            </p>
          </div>

          <Link
            href="/transfers/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#FDB515] px-6 py-3 font-bold text-black"
          >
            + New Fund Transfer
          </Link>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">
              Could not load transfers
            </p>

            <p className="mt-1 text-sm">
              {error.message}
            </p>
          </div>
        )}

        {/* TRANSFER TABLE */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-bold">
              Transfer Records
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              All transfer requests available to your account.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-gray-50">
                <tr className="text-sm uppercase text-gray-500">
                  <th className="px-6 py-4">
                    Transaction
                  </th>

                  <th className="px-6 py-4">
                    Invoice
                  </th>

                  <th className="px-6 py-4">
                    Purpose
                  </th>

                  <th className="px-6 py-4">
                    Requested
                  </th>

                  <th className="px-6 py-4">
                    Approved
                  </th>

                  <th className="px-6 py-4">
                    Transferred
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {(transfers ?? []).map(
                  (transfer) => (
                    <tr
                      key={transfer.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-6 py-5">
                        <p className="font-bold text-[#006b3c]">
                          {transfer.transaction_no}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        {transfer.invoice_no || "—"}
                      </td>

                      <td className="px-6 py-5 capitalize">
                        {String(
                          transfer.purpose_category ??
                            "—"
                        ).replaceAll("_", " ")}
                      </td>

                      <td className="px-6 py-5 font-semibold">
                        {formatMoney(
                          transfer.amount_requested
                        )}
                      </td>

                      <td className="px-6 py-5">
                        {transfer.amount_approved
                          ? formatMoney(
                              transfer.amount_approved
                            )
                          : "—"}
                      </td>

                      <td className="px-6 py-5">
                        {transfer.amount_transferred
                          ? formatMoney(
                              transfer.amount_transferred
                            )
                          : "—"}
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-semibold capitalize text-[#006b3c]">
                          {String(
                            transfer.status ??
                              "submitted"
                          ).replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={`/transfers/${transfer.id}`}
                          className="font-bold text-[#006b3c] hover:underline"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {!error &&
            (transfers ?? []).length === 0 && (
              <div className="px-6 py-14 text-center">
                <p className="font-semibold text-gray-700">
                  No transfer records found.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Create your first fund transfer
                  request to get started.
                </p>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}