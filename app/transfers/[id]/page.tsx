import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  createServerSupabaseClient,
} from "@/lib/supabase-server";

import ApproveTransferForm from "@/components/ApproveTransferForm";
import FinanceTransferEvidenceForm from "@/components/FinanceTransferEvidenceForm";
import RecipientReceiptForm from "@/components/RecipientReceiptForm";

/*
  IMPORTANT:
  This page contains authentication-dependent data.
  Force Next.js to render it fresh for every request.
*/
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ============================================================
   MONEY FORMATTER
============================================================ */

function money(
  amount:
    | number
    | string
    | null
    | undefined
) {
  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }
  ).format(
    Number(amount ?? 0)
  );
}

/* ============================================================
   TRANSFER DETAIL PAGE
============================================================ */

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } = await params;

  /* ----------------------------------------------------------
     CREATE SERVER SUPABASE CLIENT
  ---------------------------------------------------------- */

  const supabase =
    await createServerSupabaseClient();

  /* ----------------------------------------------------------
     VERIFY CURRENT USER
  ---------------------------------------------------------- */

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  if (
    authError ||
    !authData.user
  ) {
    redirect("/login");
  }

  const user =
    authData.user;

  /* ----------------------------------------------------------
     LOAD PROFILE
  ---------------------------------------------------------- */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      role,
      organization_id,
      active
      `
    )
    .eq(
      "id",
      user.id
    )
    .single();

  if (
    profileError
  ) {
    console.error(
      "Profile loading error:",
      profileError
    );
  }

  if (
    profile &&
    profile.active === false
  ) {
    redirect("/login");
  }

  /* ----------------------------------------------------------
     LOAD TRANSFER
  ---------------------------------------------------------- */

  const {
    data: transfer,
    error: transferError,
  } = await supabase
    .from("transfers")
    .select(`
      id,
      transaction_no,
      requester_id,
      sender_entity_id,
      receiver_entity_id,
      operational_certifier_entity_id,
      invoice_no,
      purpose_category,
      description,
      amount_requested,
      amount_approved,
      amount_transferred,
      status,
      approved_at,
      transferred_at,
      received_at,
      created_at
    `)
    .eq(
      "id",
      id
    )
    .single();

  if (
    transferError
  ) {
    console.error(
      "Transfer loading error:",
      transferError
    );
  }

  if (
    !transfer
  ) {
    notFound();
  }

  /* ----------------------------------------------------------
     LOAD RELATED INFORMATION
  ---------------------------------------------------------- */

  const [
    senderResult,
    receiverResult,
    certifierResult,
    paymentsResult,
    receiptResult,
    documentsResult,
    auditResult,
  ] = await Promise.all([
    /* Sender */

    transfer.sender_entity_id
      ? supabase
          .from("entities")
          .select(
            "id, name"
          )
          .eq(
            "id",
            transfer.sender_entity_id
          )
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    /* Recipient */

    transfer.receiver_entity_id
      ? supabase
          .from("entities")
          .select(
            "id, name"
          )
          .eq(
            "id",
            transfer.receiver_entity_id
          )
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    /* Operational certifier */

    transfer.operational_certifier_entity_id
      ? supabase
          .from("entities")
          .select(
            "id, name"
          )
          .eq(
            "id",
            transfer.operational_certifier_entity_id
          )
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    /* Payments */

    supabase
      .from(
        "transfer_payments"
      )
      .select("*")
      .eq(
        "transfer_id",
        id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      ),

    /* Recipient receipt */

    supabase
      .from(
        "receipt_acknowledgements"
      )
      .select("*")
      .eq(
        "transfer_id",
        id
      )
      .maybeSingle(),

    /* Documents */

    supabase
      .from(
        "transfer_documents"
      )
      .select("*")
      .eq(
        "transfer_id",
        id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      ),

    /* Audit */

    supabase
      .from(
        "audit_events"
      )
      .select(`
        id,
        event_type,
        description,
        created_at
      `)
      .eq(
        "transfer_id",
        id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      ),
  ]);

  /* ----------------------------------------------------------
     DOCUMENT SIGNED URLS
  ---------------------------------------------------------- */

  const documents =
    documentsResult.data ??
    [];

  const documentsWithUrls =
    await Promise.all(
      documents.map(
        async (
          document
        ) => {
          if (
            !document.storage_path
          ) {
            return {
              ...document,
              signedUrl: null,
            };
          }

          const {
            data,
            error,
          } =
            await supabase.storage
              .from(
                "transfer-evidence"
              )
              .createSignedUrl(
                document.storage_path,
                600
              );

          if (
            error
          ) {
            console.error(
              "Signed URL error:",
              error
            );
          }

          return {
            ...document,

            signedUrl:
              data?.signedUrl ??
              null,
          };
        }
      )
    );

  /* ----------------------------------------------------------
     PERMISSIONS
  ---------------------------------------------------------- */

  const role =
    profile?.role ??
    "requester";

  const canApprove =
    [
      "admin",
      "zari_approver",
    ].includes(
      role
    );

  const canRecordPayment =
    [
      "admin",
      "finance",
    ].includes(
      role
    );

  const isRecipient =
    role === "admin" ||
    (
      Boolean(
        profile?.organization_id
      ) &&
      profile?.organization_id ===
        transfer.receiver_entity_id
    );

  const hasReceipt =
    Boolean(
      receiptResult.data
    );

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f5f7f5] px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* BACK BUTTON */}

        <Link
          href="/transfers"
          className="font-semibold text-[#006b3c] hover:underline"
        >
          ← Back to Transfers
        </Link>

        {/* ====================================================
            TRANSFER HEADER
        ===================================================== */}

        <div className="mt-6 rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#006b3c]">
                Transfer Record
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                {transfer.transaction_no}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Created{" "}
                {new Date(
                  transfer.created_at
                ).toLocaleString()}
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-green-50 px-4 py-2 text-sm font-bold capitalize text-[#006b3c]">
              {String(
                transfer.status
              ).replaceAll(
                "_",
                " "
              )}
            </span>

          </div>

          {/* ==================================================
              BASIC DETAILS
          =================================================== */}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            <Info
              label="Sender"
              value={
                senderResult.data
                  ?.name ??
                "—"
              }
            />

            <Info
              label="Fund Recipient"
              value={
                receiverResult.data
                  ?.name ??
                "—"
              }
            />

            <Info
              label="Operational Certifier"
              value={
                certifierResult.data
                  ?.name ??
                "—"
              }
            />

            <Info
              label="Invoice Number"
              value={
                transfer.invoice_no ??
                "—"
              }
            />

            <Info
              label="Purpose"
              value={
                String(
                  transfer.purpose_category ??
                  "—"
                ).replaceAll(
                  "_",
                  " "
                )
              }
            />

            <Info
              label="Requested"
              value={
                money(
                  transfer.amount_requested
                )
              }
            />

            <Info
              label="Approved"
              value={
                transfer.amount_approved
                  ? money(
                      transfer.amount_approved
                    )
                  : "Not approved yet"
              }
            />

            <Info
              label="Transferred"
              value={
                transfer.amount_transferred
                  ? money(
                      transfer.amount_transferred
                    )
                  : "Not transferred yet"
              }
            />

            <Info
              label="Current Status"
              value={
                String(
                  transfer.status
                ).replaceAll(
                  "_",
                  " "
                )
              }
            />

          </div>

          <div className="mt-7 rounded-xl bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-500">
              Description
            </p>

            <p className="mt-2 text-gray-800">
              {transfer.description}
            </p>
          </div>
        </div>

        {/* ====================================================
            ACTIVE WORKFLOW ACTIONS
        ===================================================== */}

        <div className="mt-7 grid gap-7 lg:grid-cols-2">

          {/* APPROVAL */}

          {canApprove &&
            [
              "submitted",
              "under_review",
            ].includes(
              transfer.status
            ) && (
              <Panel title="1. Approval">
                <p className="mb-5 text-sm text-gray-500">
                  Review the request and approve the amount
                  before Finance can transfer funds.
                </p>

                <ApproveTransferForm
                  transferId={
                    transfer.id
                  }
                  requestedAmount={
                    Number(
                      transfer.amount_requested
                    )
                  }
                />
              </Panel>
            )}

          {/* FINANCE PAYMENT */}

          {canRecordPayment &&
            [
              "approved",
              "awaiting_payment",
            ].includes(
              transfer.status
            ) && (
              <Panel title="2. Finance — Record Transfer">
                <p className="mb-5 text-sm text-gray-500">
                  Record the actual bank transfer and upload
                  proof of payment.
                </p>

                <FinanceTransferEvidenceForm
                  transferId={
                    transfer.id
                  }
                  approvedAmount={
                    Number(
                      transfer.amount_approved ??
                      transfer.amount_requested
                    )
                  }
                />
              </Panel>
            )}

          {/* RECIPIENT CONFIRMATION */}

          {isRecipient &&
            transfer.status ===
              "transferred" &&
            !hasReceipt && (
              <Panel title="3. Recipient — Confirm Receipt">
                <p className="mb-5 text-sm text-gray-500">
                  Confirm the amount received and upload
                  acknowledgement evidence.
                </p>

                <RecipientReceiptForm
                  transferId={
                    transfer.id
                  }
                  expectedAmount={
                    Number(
                      transfer.amount_transferred
                    )
                  }
                />
              </Panel>
            )}

        </div>

        {/* ====================================================
            PAYMENTS
        ===================================================== */}

        <Panel title="Payment Records">

          {(paymentsResult.data ??
            []).length === 0 ? (

            <p className="text-gray-500">
              No bank transfer has been recorded yet.
            </p>

          ) : (

            <div className="space-y-4">

              {(paymentsResult.data ??
                []).map(
                (
                  payment
                ) => (
                  <div
                    key={
                      payment.id
                    }
                    className="rounded-xl border p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div>
                        <p className="text-xl font-bold">
                          {money(
                            payment.amount
                          )}
                        </p>

                        <p className="mt-2 text-sm text-gray-600">
                          Date:{" "}
                          {
                            payment.payment_date
                          }
                        </p>

                        <p className="text-sm text-gray-600">
                          Reference:{" "}
                          {
                            payment.bank_reference ??
                            "—"
                          }
                        </p>
                      </div>

                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#006b3c]">
                        Recorded
                      </span>

                    </div>
                  </div>
                )
              )}

            </div>

          )}

        </Panel>

        {/* ====================================================
            RECIPIENT CONFIRMATION
        ===================================================== */}

        <Panel title="Recipient Confirmation">

          {!receiptResult.data ? (

            <p className="text-gray-500">
              Recipient has not yet confirmed receipt.
            </p>

          ) : (

            <div className="rounded-xl border border-green-200 bg-green-50 p-5">

              <p className="font-bold text-green-800">
                Funds Received
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">

                <Info
                  label="Expected"
                  value={
                    money(
                      receiptResult
                        .data
                        .amount_expected
                    )
                  }
                />

                <Info
                  label="Received"
                  value={
                    money(
                      receiptResult
                        .data
                        .amount_received
                    )
                  }
                />

                <Info
                  label="Date"
                  value={
                    receiptResult
                      .data
                      .received_date ??
                    "—"
                  }
                />

              </div>

              {receiptResult.data
                .comments && (
                <p className="mt-5 text-sm">
                  {
                    receiptResult
                      .data
                      .comments
                  }
                </p>
              )}

            </div>

          )}

        </Panel>

        {/* ====================================================
            DOCUMENTS
        ===================================================== */}

        <Panel title="Documents & Evidence">

          {documentsWithUrls.length ===
          0 ? (

            <p className="text-gray-500">
              No transfer evidence has been uploaded yet.
            </p>

          ) : (

            <div className="space-y-3">

              {documentsWithUrls.map(
                (
                  document
                ) => (
                  <div
                    key={
                      document.id
                    }
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>
                      <p className="font-semibold">
                        {
                          document.file_name
                        }
                      </p>

                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {String(
                          document.document_type
                        ).replaceAll(
                          "_",
                          " "
                        )}
                      </p>
                    </div>

                    {document.signedUrl ? (
                      <a
                        href={
                          document.signedUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#006b3c] hover:underline"
                      >
                        View Evidence →
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">
                        File unavailable
                      </span>
                    )}

                  </div>
                )
              )}

            </div>

          )}

        </Panel>

        {/* ====================================================
            AUDIT TRAIL
        ===================================================== */}

        <Panel title="Audit Trail">

          {(auditResult.data ??
            []).length === 0 ? (

            <p className="text-gray-500">
              No audit events recorded yet.
            </p>

          ) : (

            <div className="space-y-5">

              {(auditResult.data ??
                []).map(
                (
                  event
                ) => (
                  <div
                    key={
                      event.id
                    }
                    className="border-l-4 border-[#006b3c] pl-5"
                  >

                    <p className="font-semibold capitalize">
                      {String(
                        event.event_type
                      ).replaceAll(
                        "_",
                        " "
                      )}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {
                        event.description
                      }
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(
                        event.created_at
                      ).toLocaleString()}
                    </p>

                  </div>
                )
              )}

            </div>

          )}

        </Panel>

      </div>
    </main>
  );
}

/* ============================================================
   INFO COMPONENT
============================================================ */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-semibold capitalize">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   PANEL COMPONENT
============================================================ */

function Panel({
  title,
  children,
}: {
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="mt-7 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">
        {title}
      </h2>

      {children}
    </section>
  );
}