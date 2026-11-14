# ZARIKS PartnerNet — isolated application

This directory is a **standalone Next.js application**. It is deliberately not mounted into the existing finance application's routes, middleware, authentication, or build.

## Isolation guarantees
- No imports from the parent application.
- No parent package.json, app/, lib/, proxy.ts, middleware, or configuration changes.
- No Supabase writes, migrations, or environment changes.
- No production deployment, domains, or Vercel project modifications.
- Default local mode uses in-memory sample records clearly labeled as sample data.

## Run locally
From this directory: `npm install` then `npm run dev`. Open http://localhost:3100.
Do not configure the existing finance project's Supabase environment variables here.

## Database integration gate
Before enabling database access, verify which Supabase instance the existing finance application uses. Design a separate PartnerNet schema with least-privilege grants and explicit RLS; never reuse finance service credentials. Any database changes require separate approval and security review. A separate Vercel preview project is recommended to avoid touching the current production project.

## Acceptance checks
1. Finance repository files outside this directory unchanged.
2. Local dashboard renders, navigation works, and mock orders can be added.
3. No database or external API requests occur in local mode.
4. No production deployment occurs.
