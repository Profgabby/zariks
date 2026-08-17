"use client";

import Link from "next/link";
import { logout } from "@/app/actions/auth";

type Transfer = {
  id: string;
  recipient: string;
  purpose: string;
  amount: number;
  status: string;
  date: string;
};

const initialTransfers: Transfer[] = [
  {
    id: "ZARI-TRF-2026-000001",
    recipient: "Mediatrix Consulting Services Ltd",
    purpose: "Production & Processing",
    amount: 1250000,
    status: "Awaiting Receipt",
    date: "12 Aug 2026",
  },
  {
    id: "ZARI-TRF-2026-000002",
    recipient: "Mediatrix Consulting Services Ltd",
    purpose: "Packaging Materials",
    amount: 480000,
    status: "Approved",
    date: "11 Aug 2026",
  },
  {
    id: "ZARI-TRF-2026-000003",
    recipient: "Mediatrix Consulting Services Ltd",
    purpose: "Raw Materials",
    amount: 735000,
    status: "Certified",
    date: "10 Aug 2026",
  },
];

function money(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardClient({
  user,
}: {
  user: {
    email: string;
    fullName: string;
    role: string;
  };
}) {
  const total = initialTransfers.reduce(
    (sum, transfer) => sum + transfer.amount,
    0
  );

  const pending = initialTransfers.filter(
    (transfer) =>
      transfer.status === "Awaiting Receipt" ||
      transfer.status === "Approved" ||
      transfer.status === "Submitted"
  ).length;

  const certified = initialTransfers.filter(
    (transfer) => transfer.status === "Certified"
  ).length;

  return (
    <main className="min-h-screen bg-[#f5f7f5] text-[#152019]">
      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <header className="bg-[#063d28] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-black text-[#063d28]">
              Z
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-wide">
                ZARIKS
              </h1>

              <p className="text-xs text-green-100">
                Transfer Control & Accountability
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold">
              {user.fullName}
            </p>

            <p className="text-xs capitalize text-green-100">
              {user.role.replaceAll("_", " ")}
            </p>
          </div>
        </div>
      </header>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6 py-4 text-sm font-medium md:gap-8 md:px-8">
          <Link
            href="/"
            className="whitespace-nowrap font-semibold text-[#006b3c]"
          >
            Dashboard
          </Link>

          <Link
            href="/transfers"
            className="whitespace-nowrap hover:text-[#006b3c]"
          >
            Transfers
          </Link>

          <Link
            href="/transfers"
            className="whitespace-nowrap hover:text-[#006b3c]"
          >
            Approvals
          </Link>

          <Link
            href="/mediatrix"
            className="whitespace-nowrap hover:text-[#006b3c]"
          >
            Mediatrix
          </Link>

          <Link
            href="/transfers"
            className="whitespace-nowrap hover:text-[#006b3c]"
          >
            Bello Foods
          </Link>

          <Link
            href="/transfers"
            className="whitespace-nowrap hover:text-[#006b3c]"
          >
            Retirement
          </Link>

          <Link
            href="/transfers"
            className="whitespace-nowrap hover:text-[#006b3c]"
          >
            Reports
          </Link>

          <div className="ml-auto whitespace-nowrap">
            <form action={logout}>
              <button
                type="submit"
                className="font-semibold text-red-700 hover:text-red-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* =====================================================
          MAIN DASHBOARD
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        {/* PAGE HEADER */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-[#006b3c]">
              Finance & Disbursement
            </p>

            <h2 className="text-3xl font-bold">
              Transfer Control Dashboard
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Authorize, transfer, certify, retire and reconcile
              ZARI funds.
            </p>
          </div>

          <Link
            href="/transfers/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#FDB515] px-6 py-3 font-bold text-[#172016] shadow-sm transition hover:opacity-90"
          >
            + New Fund Transfer
          </Link>
        </div>

        {/* =====================================================
            METRICS
        ====================================================== */}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Total Transfers"
            value={String(initialTransfers.length)}
          />

          <Metric
            label="Value Processed"
            value={money(total)}
          />

          <Metric
            label="Pending Actions"
            value={String(pending)}
          />

          <Metric
            label="Closed / Certified"
            value={String(certified)}
          />
        </div>

        {/* =====================================================
            TRANSFER WORKFLOW
        ====================================================== */}

        <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold">
              ZARI Transfer Flow
            </h3>

            <p className="text-sm text-gray-500">
              Controlled movement of funds and accountability.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <WorkflowStep
              number="1"
              label="Request"
            />

            <WorkflowStep
              number="2"
              label="Approve"
            />

            <WorkflowStep
              number="3"
              label="Transfer"
            />

            <WorkflowStep
              number="4"
              label="Mediatrix Receipt"
            />

            <WorkflowStep
              number="5"
              label="Bello Certification"
            />

            <WorkflowStep
              number="6"
              label="Retire & Close"
            />
          </div>
        </div>

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <QuickAction
            title="Create Transfer"
            description="Create a new auditable request for funds."
            href="/transfers/new"
            action="Create request →"
          />

          <QuickAction
            title="View Transfers"
            description="Review transfer requests, approvals and payment status."
            href="/transfers"
            action="Open transfers →"
          />

          <QuickAction
            title="Recipient Confirmation"
            description="Review payments awaiting Mediatrix receipt confirmation."
            href="/mediatrix"
            action="Open Mediatrix →"
          />
        </div>

        {/* =====================================================
            RECENT TRANSFERS
        ====================================================== */}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h3 className="font-bold">
                Recent Fund Transfers
              </h3>

              <p className="text-sm text-gray-500">
                Current transfer and certification records.
              </p>
            </div>

            <Link
              href="/transfers"
              className="text-sm font-semibold text-[#006b3c]"
            >
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">
                    Transaction
                  </th>

                  <th className="px-6 py-4">
                    Recipient
                  </th>

                  <th className="px-6 py-4">
                    Purpose
                  </th>

                  <th className="px-6 py-4">
                    Amount
                  </th>

                  <th className="px-6 py-4">
                    Date
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {initialTransfers.map((transfer) => (
                  <tr
                    key={transfer.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href="/transfers"
                        className="font-semibold text-[#006b3c]"
                      >
                        {transfer.id}
                      </Link>
                    </td>

                    <td className="px-6 py-5">
                      {transfer.recipient}
                    </td>

                    <td className="px-6 py-5">
                      {transfer.purpose}
                    </td>

                    <td className="px-6 py-5 font-semibold">
                      {money(transfer.amount)}
                    </td>

                    <td className="px-6 py-5">
                      {transfer.date}
                    </td>

                    <td className="px-6 py-5">
                      <StatusBadge
                        status={transfer.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            SECURITY NOTE
        ====================================================== */}

        <div className="mt-8 rounded-xl border border-green-100 bg-green-50 p-5">
          <p className="font-semibold text-[#006b3c]">
            ZARIKS Financial Control
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Transfer requests, payment evidence, recipient
            acknowledgement and audit events are progressively being
            moved from temporary dashboard data into the secured
            Supabase transaction workflow.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   METRIC
============================================================ */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   WORKFLOW STEP
============================================================ */

function WorkflowStep({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-green-100 bg-green-50 p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#006b3c] text-xs font-bold text-white">
        {number}
      </div>

      <p className="text-sm font-semibold">
        {label}
      </p>
    </div>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>

      <Link
        href={href}
        className="mt-4 inline-block text-sm font-semibold text-[#006b3c]"
      >
        {action}
      </Link>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let classes =
    "bg-gray-100 text-gray-700";

  if (status === "Certified") {
    classes =
      "bg-green-100 text-green-700";
  }

  if (status === "Awaiting Receipt") {
    classes =
      "bg-yellow-100 text-yellow-800";
  }

  if (status === "Approved") {
    classes =
      "bg-blue-100 text-blue-700";
  }

  if (status === "Submitted") {
    classes =
      "bg-purple-100 text-purple-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}