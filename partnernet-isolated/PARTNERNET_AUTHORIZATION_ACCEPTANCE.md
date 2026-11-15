# PartnerNet identity integration — verified constraints and acceptance tests

Updated 2026-11-14. Branch: `feature/zariks-partnernet-integration`.

## Identity provider audit
- Main ZARIKS Finance application uses Supabase SSR cookie sessions and a `procurement_members` lookup. Its sign-in flow explicitly rejects accounts not active for **ZARIKS Finance**. This membership check is **not** evidence of authorization for PartnerNet.
- Existing `zarihub` has a `profiles` table and production/quality tables. Its production orders and production batches currently have broad `authenticated` SELECT policies (`USING(true)`), so do not attach partner-facing clients to those tables.
- Existing `ZARIKS Workforce` has `workers`, `worker_roles`, `permissions`, `role_permissions` and worker-scoped RLS policies. It is a separate Supabase project; a cookie or user ID from one project cannot be assumed to establish identity in another.
- The PartnerNet Vercel preview currently has **zero configured environment variables**, so it has no approved Supabase connection to validate a real session.
- The Finance Vercel project has its own Supabase environment settings; these were inspected by name only, **not copied**.

## Required authorization design
1. Identify the approved identity authority and obtain an explicit PartnerNet membership record, rather than reusing Finance membership or a browser-selected role.
2. Require server-validated identity and active PartnerNet membership for every protected route and server action.
3. Restrict records by organization, approved staff permissions and resource ownership; deny by default. Apply database RLS as well as server checks.
4. Never rely on `user_metadata`, query parameters, localStorage, or a role dropdown to authorize requests.
5. Retain the existing public website. The old static `/site/partnernet.html` must stay protected until the rich dashboard is moved to authenticated delivery.

## Authorization acceptance matrix
| Case | Expected |
|---|---|
| Anonymous visitor opens public pages | Allowed |
| Anonymous visitor opens /operations, /staff, /admin, /site/partnernet.html | Denied |
| Authenticated Finance-only user with no PartnerNet membership | Denied |
| Authenticated partner from organization A reads organization B's orders | Denied |
| Partner tries staff/admin module or direct API endpoint | Denied |
| Staff without approval permission releases QC batch | Denied |
| Revoked or inactive account uses a stale session | Denied |
| Authorized partner reads only organization A's permitted records | Allowed |
| Authorized staff accesses only assigned scopes | Allowed |
| Unapproved profile tries to edit its own role or organization membership | Denied |

## Deployment gate
- Current middleware is deliberately fail-closed, not an operational login.
- No cross-project identity mapping, live credentials or database authorization rules were changed.
- Enable protected routes only after the above tests run against the approved existing identity and RLS configuration.
