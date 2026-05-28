# Transfer Pro

Transfer Pro is an original full-stack private transfer booking platform for driver-led businesses. It combines a public conversion-focused website with a role-based operations workspace for admins, drivers, and customers.

## What’s Included

- Public marketing pages with SEO metadata and destination landing pages
- Fixed-price booking funnel with vehicle merchandising and Stripe-ready checkout handoff
- Quote request flow for long-distance, hourly, and multi-stop rides
- Customer sign-up and sign-in flow with signed JWT cookie sessions
- Admin dashboard for bookings, quotes, routes, fleet, drivers, customers, and invoices
- Driver-facing trip board and customer-facing booking/invoice account views
- InsForge-backed schema for users, customer profiles, drivers, vehicles, routes, prices, quotes, bookings, payments, invoices, notifications, and audit logs
- Route handlers for pricing, bookings, quotes, checkout, and Stripe webhooks

## InsForge Status

This workspace is now linked to the InsForge project `Get Transfer` through `.insforge/project.json`, and the transfer database schema has been bootstrapped into InsForge via `npx @insforge/cli db import insforge/schema.sql`.

Current state:

- Infrastructure/backend management now goes through `npx @insforge/cli`
- The live InsForge backend contains the core transfer tables
- The application runtime now reads and writes bookings, quotes, users, invoices, vehicles, routes, and notifications through `@insforge/sdk`
- `insforge/seed.sql` mirrors the demo dataset into the linked backend so the public site and dashboards stay populated

## Stack

- `Next.js 15` with App Router and server components by default
- `TypeScript`
- `Tailwind CSS`
- `InsForge` for hosted PostgreSQL, backend metadata, and CLI-backed schema management
- `@insforge/sdk` for server-side data access
- `Stripe` integration hooks for checkout and webhook handling
- Signed JWT cookie auth using `jose`
- `InsForge CLI` for linked backend infrastructure, schema import, and data seeding

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and set values. The app can still run in demo mode without Stripe. Live backend mode requires `INSFORGE_URL` and `INSFORGE_ANON_KEY`.

3. Import the transfer schema and demo dataset into the linked InsForge project:

```bash
npm run backend:schema
npm run backend:seed
```

4. Start the app:

```bash
npm run dev
```

## InsForge Commands

Verify the linked project:

```bash
npx @insforge/cli current --json
```

Inspect backend metadata:

```bash
npx @insforge/cli metadata --json
```

Re-import the live transfer schema:

```bash
npx @insforge/cli db import insforge/schema.sql
```

Import the live demo dataset:

```bash
npx @insforge/cli db import insforge/seed.sql
```

## Demo Accounts

- Admin: `admin@transferpro.test` / `demo1234`
- Driver: `driver@transferpro.test` / `demo1234`
- Customer: `customer@transferpro.test` / `demo1234`

## Structure

```text
app/
  api/
  book/
  dashboard/
  destinations/[slug]/
  fleet/
  how-it-works/
  quotes/
  routes/
  sign-in/
  sign-up/
components/
  auth/
  booking/
  dashboard/
  marketing/
  ui/
docs/
  architecture.md
lib/
  auth.ts
  insforge.ts
  notifications.ts
  payments.ts
  repository.ts
  seo.ts
  site-data.ts
  types.ts
  utils.ts
  validation.ts
insforge/
  schema.sql
  seed.sql
prisma/
  schema.prisma
  seed.ts
```

## Delivery Notes

- Without InsForge env vars, the site uses a realistic demo-data mode so the public site and dashboards remain explorable.
- With `INSFORGE_URL` and `INSFORGE_ANON_KEY`, Transfer Pro uses `@insforge/sdk` for routes, vehicles, quotes, bookings, invoices, user records, and notification writes.
- Stripe checkout is live only when `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_APP_URL` are configured.
- `prisma/schema.prisma` remains in the repo as a domain-model snapshot, but backend operations now run through InsForge CLI and SQL under `insforge/`.

See [architecture.md](./docs/architecture.md) for architecture, schema, page design, workflow, and deployment details.
