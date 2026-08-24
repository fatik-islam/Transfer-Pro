# Transfer Pro

Transfer Pro is a production-oriented private-transfer booking and dispatch platform. It combines a public booking website with role-based workspaces for administrators, drivers, and customers.

## Capabilities

- Dynamic road-route pricing with signed fare locks
- Stripe authorization, capture, settlement, tips, refunds, and verified webhooks
- Customer email/Google sign-in with revocable, HTTP-only cookie sessions
- Admin dispatch, driver trip workflow, customer bookings, and invoices
- Email, SMS, and WhatsApp notification adapters
- Server-only InsForge persistence with RLS enabled on every application table
- SEO metadata, sitemap, robots rules, and installable web-app manifest

## Stack

- Next.js 16 App Router, TypeScript, React, and Tailwind CSS
- InsForge PostgreSQL and `@insforge/sdk`
- Stripe Checkout and webhooks
- `jose` JWT signing and `bcryptjs` password hashing
- Prisma schema as the checked-in domain-model snapshot

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `INSFORGE_URL` and the server-only `INSFORGE_API_KEY`. Never expose the API key through a `NEXT_PUBLIC_` variable.
4. Set a strong `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, and the provider credentials required for the features being used.
5. Start the application with `npm run dev`.

Without InsForge server credentials, local development uses the static demo dataset. Production must always have `INSFORGE_URL`, `INSFORGE_API_KEY`, and `JWT_SECRET` configured.

## Database workflow

The workspace is linked to the InsForge project through `.insforge/project.json`.

```bash
npm run backend:current
npm run backend:schema       # fresh databases only
npm run backend:migrate      # additive production migration
npm run backend:lockdown     # enables RLS after server-key deployment
```

`insforge/seed.sql` is legacy development fixture data. It must not be imported into production. The application no longer exposes or documents shared demo credentials.

## Security model

- Browser code never receives database credentials or performs direct database queries.
- The Next.js server uses the InsForge project API key; all public database roles are blocked by RLS.
- Sessions are revalidated against the user record and invalidated after password changes, password resets, account anonymization, role changes, or JWT-secret rotation.
- Payment amounts and currencies come from stored bookings. Webhooks require valid Stripe signatures, reject missing metadata, validate totals, and deduplicate event IDs.
- Customer payment actions validate booking ownership. Driver and admin booking updates follow an explicit state-transition matrix.

## Main structure

```text
app/                 pages, server actions, and route handlers
components/          booking, dashboard, marketing, and UI components
lib/                 auth, pricing, payments, repository, and providers
insforge/            baseline schema and ordered production migrations
prisma/              domain-model snapshot
docs/                architecture and operating notes
```

See [docs/architecture.md](./docs/architecture.md) for the detailed system design.
