export const ZARIKS_APPROVED_EMAILS = [
  "khadoj85@gmail.com",
  "mediatrixconsultancyservices@gmail.com",
  "1010defranc@gmail.com",
  "ayayiagabriel2020@gmail.com",
] as const;

export function isApprovedZariksEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return ZARIKS_APPROVED_EMAILS.includes(normalized as (typeof ZARIKS_APPROVED_EMAILS)[number]);
}
