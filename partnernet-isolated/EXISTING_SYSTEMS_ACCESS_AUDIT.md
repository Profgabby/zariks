# ZARIKS PartnerNet — Existing Infrastructure Audit (read-only)

Date: 2026-11-14. Scope: `feature/zariks-partnernet-integration`, existing ZARIKS services. No database or production settings were changed.

## Current interface
- The public site is hosted as static pages in `partnernet-isolated/public/site/`, with original logo and 16 campaign images.
- The detailed `partnernet.html` contains operational planning modules, but its browser-local state and role selection were not authenticated. The misleading role-switcher has been removed.
- The separate `/operations` Next.js dashboard stores records only in memory; no persistence or authenticated permissions exist there.
- The main repository app has `@supabase/ssr`, `@supabase/supabase-js`, and a session-refresh proxy; the isolated preview does not yet share these services.

## Existing databases — inspected read-only
### zarihub (ocopgegixwubulynboui)
- Public schema includes profiles, products, stock, sales, production_orders, production_batches, qc_checks, operations_audit_events and other operational tables.
- The inspected tables have RLS enabled.
- Critical authorization concern: policies `ops authenticated read orders` and `ops authenticated read batches` use `USING (true)` for role `authenticated`. This is not tenant or organization isolation. Do not expose these tables to partner accounts until their policies are redesigned and tested.
- Profiles have separate self-read and admin-access policies; inspect their underlying functions before reusing roles.

### ZARIKS Workforce (vsylwhwxianppnsbpqkj)
- Public schema includes workers, worker_roles, permissions, role_permissions, worker_permission_overrides and workforce_access_audit.
- The inspected tables have RLS enabled. Workers SELECT is conditional on workforce-management privileges, the current user's auth_user_id, or management of a particular worker. Role/permission tables have admin write rules and authenticated read rules.
- This permission model may inform staff authorization, but no cross-project identity mapping or safe reuse has been demonstrated.

## Required access model
1. Public site: no sign-in for marketing content, product information, contact and partnership applications.
2. Partners: authenticated, verified organization membership and organization-scoped records. No global production/finance read access.
3. Staff: verified staff identity and explicit module-level permissions; separate operational role assignments.
4. Administrators: authenticated administrator membership, server-side authorization, audit trail and least-privilege privileges.

## Implementation gates before live data
- Inventory the current auth providers, projects, cookie/session boundaries, claims and role functions; do not assume that separate Supabase projects share user identities.
- Identify which existing ZARIKS database is authoritative for each business entity. Do not duplicate tables or mix workforce and financial records indiscriminately.
- Inspect all relevant RLS policies, table grants, privileged functions and views. Address `USING(true)` access on production orders/batches before any partner connection.
- Build server-side session checks and organization-specific authorization; test cross-organization denial, unauthorized writes, revoked accounts, and direct API requests.
- Do not turn the current local-only profile or role previews into purported live accounts.
- Only then wire operational forms to approved existing data sources, run regression tests and deploy to the isolated PartnerNet preview.

## Current boundaries
No new Supabase project. No schema migrations, database writes, or production Finance/Workforce application changes authorized by this audit. All planned changes require explicit tests and verified permissions.
