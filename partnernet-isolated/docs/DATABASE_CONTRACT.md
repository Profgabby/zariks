# PartnerNet database contract — design only, NOT applied

## Isolation boundary
The existing ZARIKS Finance application and its database must not be modified. The existing `zarihub` database is read-only during discovery. Do not reuse its privileged functions or public schemas without a security review. No migration is authorized by this document.

## Proposed namespace
Use a dedicated PartnerNet schema `partnernet` only after approval, or a dedicated project if a hard security boundary is required. Never expose privileged credentials to a browser. The browser may use only a publishable key with correctly scoped RLS; writes must be authorized server-side or through tightly scoped policies.

## Tables and contracts
| Entity | Primary fields | Relationships / rule |
| --- | --- | --- |
| organizations | id, name, kind, status | Producer, supplier, distributor, school or institutional buyer |
| memberships | id, user_id, organization_id, role, active | Role/tenant authorization |
| hubs | id, organization_id, state, lga, capacity_per_day, status | Operational facility; approval separate from registration |
| products | id, sku, name, format, active | Unique SKU |
| batches | id, hub_id, sku, planned_qty, actual_qty, status, produced_at | Lot traceability |
| material_lots | id, owner_id, material_code, qty, uom, expiry | Traceable materials |
| quality_checks | id, batch_id, check_code, result, reviewer_id, checked_at | Hold/release gate |
| inventory_moves | id, batch_id, hub_id, quantity_delta, reason, created_at | Append-only inventory ledger |
| orders | id, buyer_id, status, created_at | Buyer-owned order |
| order_lines | id, order_id, sku, quantity, unit_price | Positive quantity, price in minor units |
| deliveries | id, order_id, dispatch_hub_id, status, proof_ref | Fulfillment lifecycle |
| invoices | id, order_id, amount_minor, currency, status | Financial boundary: no existing Finance writes |
| audit_events | id, actor_id, action, entity, entity_id, at | Append-only |

## API interface
- `GET /api/partnernet/products`: approved public catalog only.
- `GET /api/partnernet/overview`: tenant-scoped operational aggregates.
- `GET|POST /api/partnernet/orders`: buyer orders, authenticated and tenant scoped.
- `GET|POST /api/partnernet/batches`: authorized producer operations.
- `POST /api/partnernet/quality-checks`: reviewer role only.
- `POST /api/partnernet/deliveries/:id/dispatch`: authorized logistics role.
- `GET /api/partnernet/reports`: restricted, auditable aggregates.

## Security acceptance
RLS on every exposed table, tenant-scoped SELECT/INSERT/UPDATE/DELETE, explicit ownership checks, no anonymous privileged RPC execution, no `service_role` key in browser, no direct changes to existing `zarihub` finance or workforce records. Production release requires an RLS adversarial test matrix, audit review, and backup/rollback procedure.

## Migration decision
**NOT APPROVED / NOT EXECUTED.** This document is a contract proposal; database connectivity remains disabled until separate authorization.
