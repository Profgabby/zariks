"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import type {
  TransferActionState,
} from "@/lib/transfer-state";

/* ============================================================
   HELPERS
============================================================ */

function getText(
  formData: FormData,
  key: string
): string {
  return String(
    formData.get(key) ?? ""
  ).trim();
}

function success(
  message: string
): TransferActionState {
  return {
    ok: true,
    message,
  };
}

function failure(
  message: string
): TransferActionState {
  return {
    ok: false,
    message,
  };
}

async function getSignedInUser() {
  const supabase =
    await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "You must be signed in."
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
      id,
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
    profileError ||
    !profile
  ) {
    throw new Error(
      "Your ZARIKS profile could not be loaded."
    );
  }

  if (
    profile.active === false
  ) {
    throw new Error(
      "Your ZARIKS account is inactive."
    );
  }

  return {
    supabase,
    user,
    profile,
  };
}

function validateEvidenceFile(
  file: File
) {
  if (
    !file ||
    file.size === 0
  ) {
    throw new Error(
      "Please upload an evidence file."
    );
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (
    !allowedTypes.includes(
      file.type
    )
  ) {
    throw new Error(
      "Only PDF, JPG/JPEG or PNG files are allowed."
    );
  }

  const maximumSize =
    10 * 1024 * 1024;

  if (
    file.size >
    maximumSize
  ) {
    throw new Error(
      "The evidence file must not exceed 10 MB."
    );
  }
}

function cleanFileName(
  fileName: string
): string {
  return fileName.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );
}

/* ============================================================
   1. CREATE FUND TRANSFER REQUEST
============================================================ */

export async function createTransferRequest(
  _previousState: TransferActionState,
  formData: FormData
): Promise<TransferActionState> {
  try {
    const {
      supabase,
      user,
    } =
      await getSignedInUser();

    const invoiceNo =
      getText(
        formData,
        "invoice_no"
      );

    const purposeCategory =
      getText(
        formData,
        "purpose_category"
      );

    const description =
      getText(
        formData,
        "description"
      );

    const amountRequested =
      Number(
        formData.get(
          "amount_requested"
        )
      );

    if (
      !purposeCategory
    ) {
      return failure(
        "Please select a transfer purpose."
      );
    }

    if (
      !description
    ) {
      return failure(
        "Please provide a detailed description."
      );
    }

    if (
      !Number.isFinite(
        amountRequested
      ) ||
      amountRequested <= 0
    ) {
      return failure(
        "Please enter a valid amount requested."
      );
    }

    /* --------------------------------------------------------
       LOAD THE THREE ORGANIZATIONS
    --------------------------------------------------------- */

    const {
      data: entities,
      error: entityError,
    } = await supabase
      .from("entities")
      .select(
        "id, name"
      )
      .in(
        "name",
        [
          "ZARI",
          "Mediatrix Consulting Services Ltd",
          "Bello Foods Nigeria Ltd",
        ]
      );

    if (
      entityError
    ) {
      throw new Error(
        `Could not load organizations: ${entityError.message}`
      );
    }

    const zari =
      entities?.find(
        (entity) =>
          entity.name ===
          "ZARI"
      );

    const mediatrix =
      entities?.find(
        (entity) =>
          entity.name ===
          "Mediatrix Consulting Services Ltd"
      );

    const bello =
      entities?.find(
        (entity) =>
          entity.name ===
          "Bello Foods Nigeria Ltd"
      );

    if (
      !zari ||
      !mediatrix ||
      !bello
    ) {
      return failure(
        "ZARI, Mediatrix Consulting Services Ltd and Bello Foods Nigeria Ltd must exist in the entities table before a transfer can be created."
      );
    }

    /* --------------------------------------------------------
       CREATE TRANSFER
    --------------------------------------------------------- */

    const {
      data: transfer,
      error: insertError,
    } = await supabase
      .from("transfers")
      .insert({
        requester_id:
          user.id,

        sender_entity_id:
          zari.id,

        receiver_entity_id:
          mediatrix.id,

        operational_certifier_entity_id:
          bello.id,

        invoice_no:
          invoiceNo ||
          null,

        purpose_category:
          purposeCategory,

        description,

        amount_requested:
          amountRequested,

        status:
          "submitted",
      })
      .select(
        `
        id,
        transaction_no
        `
      )
      .single();

    if (
      insertError ||
      !transfer
    ) {
      throw new Error(
        insertError?.message ??
          "The transfer request could not be created."
      );
    }

    /* --------------------------------------------------------
       AUDIT EVENT
    --------------------------------------------------------- */

    const {
      error: auditError,
    } = await supabase
      .from(
        "audit_events"
      )
      .insert({
        transfer_id:
          transfer.id,

        actor_id:
          user.id,

        event_type:
          "transfer_submitted",

        description:
          `Transfer ${transfer.transaction_no} submitted.`,

        metadata: {
          invoice_no:
            invoiceNo ||
            null,

          amount_requested:
            amountRequested,

          purpose_category:
            purposeCategory,
        },
      });

    if (
      auditError
    ) {
      console.error(
        "Audit event error:",
        auditError
      );
    }

    revalidatePath("/");
    revalidatePath(
      "/transfers"
    );
    revalidatePath(
      "/transfers/new"
    );

    return success(
      `Transfer ${transfer.transaction_no} created successfully.`
    );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to create the transfer request."
    );
  }
}

/* ============================================================
   2. APPROVE FUND TRANSFER
============================================================ */

export async function approveTransfer(
  transferId: string,
  _previousState: TransferActionState,
  formData: FormData
): Promise<TransferActionState> {
  try {
    const {
      supabase,
      user,
      profile,
    } =
      await getSignedInUser();

    if (
      ![
        "admin",
        "zari_approver",
      ].includes(
        profile.role
      )
    ) {
      return failure(
        "You are not authorized to approve fund transfers."
      );
    }

    const amountApproved =
      Number(
        formData.get(
          "amount_approved"
        )
      );

    const comments =
      getText(
        formData,
        "comments"
      );

    if (
      !Number.isFinite(
        amountApproved
      ) ||
      amountApproved <= 0
    ) {
      return failure(
        "Enter a valid approved amount."
      );
    }

    /* --------------------------------------------------------
       GET TRANSFER
    --------------------------------------------------------- */

    const {
      data: transfer,
      error: readError,
    } = await supabase
      .from("transfers")
      .select(
        `
        id,
        transaction_no,
        status,
        amount_requested
        `
      )
      .eq(
        "id",
        transferId
      )
      .single();

    if (
      readError ||
      !transfer
    ) {
      return failure(
        "Transfer not found."
      );
    }

    if (
      ![
        "submitted",
        "under_review",
      ].includes(
        transfer.status
      )
    ) {
      return failure(
        "This transfer is not awaiting approval."
      );
    }

    /* --------------------------------------------------------
       UPDATE TRANSFER
    --------------------------------------------------------- */

    const {
      error: updateError,
    } = await supabase
      .from("transfers")
      .update({
        amount_approved:
          amountApproved,

        approved_at:
          new Date()
            .toISOString(),

        status:
          "approved",
      })
      .eq(
        "id",
        transferId
      );

    if (
      updateError
    ) {
      throw new Error(
        updateError.message
      );
    }

    /* --------------------------------------------------------
       APPROVAL RECORD
    --------------------------------------------------------- */

    const {
      error: actionError,
    } = await supabase
      .from(
        "transfer_actions"
      )
      .insert({
        transfer_id:
          transferId,

        actor_id:
          user.id,

        action_type:
          "approval",

        decision:
          "approved",

        comments:
          comments ||
          null,
      });

    if (
      actionError
    ) {
      console.error(
        "Transfer action error:",
        actionError
      );
    }

    /* --------------------------------------------------------
       AUDIT EVENT
    --------------------------------------------------------- */

    const {
      error: auditError,
    } = await supabase
      .from(
        "audit_events"
      )
      .insert({
        transfer_id:
          transferId,

        actor_id:
          user.id,

        event_type:
          "transfer_approved",

        description:
          `${transfer.transaction_no} approved for ₦${amountApproved.toLocaleString(
            "en-NG"
          )}.`,

        metadata: {
          amount_requested:
            transfer.amount_requested,

          amount_approved:
            amountApproved,

          comments:
            comments ||
            null,
        },
      });

    if (
      auditError
    ) {
      console.error(
        "Audit event error:",
        auditError
      );
    }

    revalidatePath(
      `/transfers/${transferId}`
    );

    revalidatePath(
      "/transfers"
    );

    revalidatePath("/");

    return success(
      "Transfer approved successfully."
    );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to approve the transfer."
    );
  }
}

/* ============================================================
   3. FINANCE RECORDS ACTUAL PAYMENT
   + UPLOADS BANK TRANSFER EVIDENCE
============================================================ */

export async function recordTransferPayment(
  transferId: string,
  _previousState: TransferActionState,
  formData: FormData
): Promise<TransferActionState> {
  try {
    const {
      supabase,
      user,
      profile,
    } =
      await getSignedInUser();

    if (
      ![
        "admin",
        "finance",
      ].includes(
        profile.role
      )
    ) {
      return failure(
        "Only Finance or an administrator can record a payment."
      );
    }

    const amount =
      Number(
        formData.get(
          "amount"
        )
      );

    const paymentDate =
      getText(
        formData,
        "payment_date"
      );

    const bankReference =
      getText(
        formData,
        "bank_reference"
      );

    const senderBank =
      getText(
        formData,
        "sender_bank"
      );

    const receiverBank =
      getText(
        formData,
        "receiver_bank"
      );

    const paymentMethod =
      getText(
        formData,
        "payment_method"
      ) ||
      "bank_transfer";

    const evidence =
      formData.get(
        "evidence"
      );

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      return failure(
        "Enter a valid payment amount."
      );
    }

    if (
      !paymentDate
    ) {
      return failure(
        "Select the payment date."
      );
    }

    if (
      !bankReference
    ) {
      return failure(
        "Enter the bank transaction reference."
      );
    }

    if (
      !(
        evidence instanceof
        File
      )
    ) {
      return failure(
        "Upload proof of transfer."
      );
    }

    try {
      validateEvidenceFile(
        evidence
      );
    } catch (error) {
      return failure(
        error instanceof Error
          ? error.message
          : "Invalid evidence file."
      );
    }

    /* --------------------------------------------------------
       GET TRANSFER
    --------------------------------------------------------- */

    const {
      data: transfer,
      error: transferError,
    } = await supabase
      .from("transfers")
      .select(
        `
        id,
        transaction_no,
        status,
        amount_approved
        `
      )
      .eq(
        "id",
        transferId
      )
      .single();

    if (
      transferError ||
      !transfer
    ) {
      return failure(
        "Transfer not found."
      );
    }

    if (
      ![
        "approved",
        "awaiting_payment",
        "transferred",
      ].includes(
        transfer.status
      )
    ) {
      return failure(
        "This transfer has not been approved for payment."
      );
    }

    /* --------------------------------------------------------
       UPLOAD EVIDENCE
    --------------------------------------------------------- */

    const safeFileName =
      cleanFileName(
        evidence.name
      );

    const storagePath =
      `${transferId}` +
      `/bank_transfer/` +
      `${Date.now()}-` +
      `${safeFileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        "transfer-evidence"
      )
      .upload(
        storagePath,
        evidence,
        {
          contentType:
            evidence.type,

          upsert:
            false,
        }
      );

    if (
      uploadError
    ) {
      throw new Error(
        `Evidence upload failed: ${uploadError.message}`
      );
    }

    /* --------------------------------------------------------
       PAYMENT RECORD
    --------------------------------------------------------- */

    const {
      data: payment,
      error: paymentError,
    } = await supabase
      .from(
        "transfer_payments"
      )
      .insert({
        transfer_id:
          transferId,

        amount,

        payment_date:
          paymentDate,

        bank_reference:
          bankReference,

        payment_method:
          paymentMethod,

        sender_bank:
          senderBank ||
          null,

        receiver_bank:
          receiverBank ||
          null,

        recorded_by:
          user.id,
      })
      .select("id")
      .single();

    if (
      paymentError ||
      !payment
    ) {
      await supabase.storage
        .from(
          "transfer-evidence"
        )
        .remove([
          storagePath,
        ]);

      throw new Error(
        paymentError?.message ??
          "Payment could not be recorded."
      );
    }

    /* --------------------------------------------------------
       DOCUMENT RECORD
    --------------------------------------------------------- */

    const {
      error: documentError,
    } = await supabase
      .from(
        "transfer_documents"
      )
      .insert({
        transfer_id:
          transferId,

        document_type:
          "bank_transfer",

        file_name:
          evidence.name,

        storage_path:
          storagePath,

        uploaded_by:
          user.id,
      });

    if (
      documentError
    ) {
      console.error(
        "Transfer document error:",
        documentError
      );
    }

    /* --------------------------------------------------------
       UPDATE MAIN TRANSFER
    --------------------------------------------------------- */

    const {
      error: updateError,
    } = await supabase
      .from("transfers")
      .update({
        amount_transferred:
          amount,

        transferred_at:
          new Date()
            .toISOString(),

        status:
          "transferred",
      })
      .eq(
        "id",
        transferId
      );

    if (
      updateError
    ) {
      throw new Error(
        updateError.message
      );
    }

    /* --------------------------------------------------------
       AUDIT EVENT
    --------------------------------------------------------- */

    const {
      error: auditError,
    } = await supabase
      .from(
        "audit_events"
      )
      .insert({
        transfer_id:
          transferId,

        actor_id:
          user.id,

        event_type:
          "funds_transferred",

        description:
          `${transfer.transaction_no}: ₦${amount.toLocaleString(
            "en-NG"
          )} transferred.`,

        metadata: {
          amount,

          payment_date:
            paymentDate,

          bank_reference:
            bankReference,

          sender_bank:
            senderBank ||
            null,

          receiver_bank:
            receiverBank ||
            null,

          storage_path:
            storagePath,
        },
      });

    if (
      auditError
    ) {
      console.error(
        "Audit event error:",
        auditError
      );
    }

    revalidatePath(
      `/transfers/${transferId}`
    );

    revalidatePath(
      "/transfers"
    );

    revalidatePath(
      "/mediatrix"
    );

    revalidatePath("/");

    return success(
      "Payment recorded and transfer evidence uploaded successfully."
    );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to record the transfer payment."
    );
  }
}

/* ============================================================
   4. RECIPIENT CONFIRMS RECEIPT
   + UPLOADS ACKNOWLEDGEMENT
============================================================ */

export async function confirmRecipientReceipt(
  transferId: string,
  _previousState: TransferActionState,
  formData: FormData
): Promise<TransferActionState> {
  try {
    const {
      supabase,
      user,
      profile,
    } =
      await getSignedInUser();

    const amountReceived =
      Number(
        formData.get(
          "amount_received"
        )
      );

    const receivedDate =
      getText(
        formData,
        "received_date"
      );

    const bankReference =
      getText(
        formData,
        "bank_reference"
      );

    const comments =
      getText(
        formData,
        "comments"
      );

    const evidence =
      formData.get(
        "evidence"
      );

    if (
      !Number.isFinite(
        amountReceived
      ) ||
      amountReceived <= 0
    ) {
      return failure(
        "Enter the amount actually received."
      );
    }

    if (
      !receivedDate
    ) {
      return failure(
        "Select the date the funds were received."
      );
    }

    if (
      !(
        evidence instanceof
        File
      )
    ) {
      return failure(
        "Upload receipt or acknowledgement evidence."
      );
    }

    try {
      validateEvidenceFile(
        evidence
      );
    } catch (error) {
      return failure(
        error instanceof Error
          ? error.message
          : "Invalid evidence file."
      );
    }

    /* --------------------------------------------------------
       GET TRANSFER
    --------------------------------------------------------- */

    const {
      data: transfer,
      error: transferError,
    } = await supabase
      .from("transfers")
      .select(
        `
        id,
        transaction_no,
        receiver_entity_id,
        amount_transferred,
        status
        `
      )
      .eq(
        "id",
        transferId
      )
      .single();

    if (
      transferError ||
      !transfer
    ) {
      return failure(
        "Transfer not found."
      );
    }

    /* --------------------------------------------------------
       CHECK RECIPIENT AUTHORITY
    --------------------------------------------------------- */

    const isAdmin =
      profile.role ===
      "admin";

    const isAssignedRecipient =
      profile.organization_id ===
      transfer.receiver_entity_id;

    if (
      !isAdmin &&
      !isAssignedRecipient
    ) {
      return failure(
        "You are not the authorized recipient for this transfer."
      );
    }

    if (
      ![
        "transferred",
        "disputed",
      ].includes(
        transfer.status
      )
    ) {
      return failure(
        "This transfer is not awaiting recipient confirmation."
      );
    }

    /* --------------------------------------------------------
       PREVENT DUPLICATE RECEIPT CONFIRMATION
    --------------------------------------------------------- */

    const {
      data:
        existingReceipt,
      error:
        receiptLookupError,
    } = await supabase
      .from(
        "receipt_acknowledgements"
      )
      .select("id")
      .eq(
        "transfer_id",
        transferId
      )
      .maybeSingle();

    if (
      receiptLookupError
    ) {
      throw new Error(
        receiptLookupError.message
      );
    }

    if (
      existingReceipt
    ) {
      return failure(
        "Receipt has already been confirmed for this transfer."
      );
    }

    /* --------------------------------------------------------
       UPLOAD ACKNOWLEDGEMENT
    --------------------------------------------------------- */

    const safeFileName =
      cleanFileName(
        evidence.name
      );

    const storagePath =
      `${transferId}` +
      `/recipient_acknowledgement/` +
      `${Date.now()}-` +
      `${safeFileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        "transfer-evidence"
      )
      .upload(
        storagePath,
        evidence,
        {
          contentType:
            evidence.type,

          upsert:
            false,
        }
      );

    if (
      uploadError
    ) {
      throw new Error(
        `Acknowledgement upload failed: ${uploadError.message}`
      );
    }

    /* --------------------------------------------------------
       RECEIPT RECORD
    --------------------------------------------------------- */

    const expectedAmount =
      Number(
        transfer.amount_transferred ??
          0
      );

    const {
      data: receipt,
      error: receiptError,
    } = await supabase
      .from(
        "receipt_acknowledgements"
      )
      .insert({
        transfer_id:
          transferId,

        amount_expected:
          expectedAmount,

        amount_received:
          amountReceived,

        received_date:
          receivedDate,

        bank_reference:
          bankReference ||
          null,

        confirmed_by:
          user.id,

        comments:
          comments ||
          null,
      })
      .select("id")
      .single();

    if (
      receiptError ||
      !receipt
    ) {
      await supabase.storage
        .from(
          "transfer-evidence"
        )
        .remove([
          storagePath,
        ]);

      throw new Error(
        receiptError?.message ??
          "Receipt acknowledgement could not be recorded."
      );
    }

    /* --------------------------------------------------------
       DOCUMENT RECORD
    --------------------------------------------------------- */

    const {
      error: documentError,
    } = await supabase
      .from(
        "transfer_documents"
      )
      .insert({
        transfer_id:
          transferId,

        document_type:
          "recipient_acknowledgement",

        file_name:
          evidence.name,

        storage_path:
          storagePath,

        uploaded_by:
          user.id,
      });

    if (
      documentError
    ) {
      console.error(
        "Document registration error:",
        documentError
      );
    }

    /* --------------------------------------------------------
       DETERMINE STATUS
    --------------------------------------------------------- */

    const newStatus =
      amountReceived <
      expectedAmount
        ? "disputed"
        : "received";

    /* --------------------------------------------------------
       UPDATE TRANSFER
    --------------------------------------------------------- */

    const {
      error: updateError,
    } = await supabase
      .from("transfers")
      .update({
        received_at:
          new Date()
            .toISOString(),

        status:
          newStatus,
      })
      .eq(
        "id",
        transferId
      );

    if (
      updateError
    ) {
      throw new Error(
        updateError.message
      );
    }

    /* --------------------------------------------------------
       AUDIT EVENT
    --------------------------------------------------------- */

    const {
      error: auditError,
    } = await supabase
      .from(
        "audit_events"
      )
      .insert({
        transfer_id:
          transferId,

        actor_id:
          user.id,

        event_type:
          "recipient_confirmed_receipt",

        description:
          `${transfer.transaction_no}: recipient confirmed ₦${amountReceived.toLocaleString(
            "en-NG"
          )} received.`,

        metadata: {
          amount_expected:
            expectedAmount,

          amount_received:
            amountReceived,

          received_date:
            receivedDate,

          bank_reference:
            bankReference ||
            null,

          storage_path:
            storagePath,

          result:
            newStatus,
        },
      });

    if (
      auditError
    ) {
      console.error(
        "Audit event error:",
        auditError
      );
    }

    revalidatePath(
      `/transfers/${transferId}`
    );

    revalidatePath(
      "/transfers"
    );

    revalidatePath(
      "/mediatrix"
    );

    revalidatePath("/");

    if (
      newStatus ===
      "received"
    ) {
      return success(
        "Receipt confirmed successfully."
      );
    }

    return success(
      "Partial receipt recorded. The transfer has been marked as disputed for review."
    );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to confirm receipt."
    );
  }
}