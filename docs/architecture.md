# Transfer Pro Architecture

## Product Shape

Transfer Pro is a premium transfer commerce platform with two connected surfaces:

- Public website: acquisition, route SEO, fleet merchandising, fixed-price booking, quote intake, and account onboarding.
- Operations workspace: admin, driver, and customer views for booking management, pricing, assignment, payment state, invoice visibility, and communication.

The product is intentionally original in branding and interface direction. It uses a marketplace-style homepage, city-night gradients, tabbed journey discovery, offer-led merchandising, and a calm operations shell rather than a generic SaaS dashboard.

## Core Capabilities

- Direct customer bookings for fixed-price routes
- Quote-based ride intake for bespoke journeys
- Admin control over routes, route mode, pricing, and fleet
- Customer account creation and sign-in
- Driver-visible trip board
- Driver assignment data model
- Payment integration hooks with Stripe
- Vehicle listings and booking merchandising
- Booking, quote, invoice, and notification records
- SEO-ready marketing pages and destination templates

## Architecture

### Runtime

- `Next.js App Router` is the application shell.
- Server components render most pages to keep the public site fast and reduce client bundle size.
- Client components are limited to interactive forms and account actions.
- Server actions handle auth, booking creation, and quote submission from forms.
- Route handlers expose pricing and signed provider callbacks. Checkout creation is server-action-only so clients cannot submit prices.

### Data Layer

- `InsForge` is the primary persistence layer and backend control plane.
- `lib/repository.ts` isolates read and write logic so the UI can remain agnostic to whether the app is in demo-data mode or InsForge-backed mode.
- Demo mode keeps local development explorable before infrastructure is provisioned; it is never the production data path.
- This workspace is linked to an InsForge backend project. Ordered SQL migrations under `insforge/migrations/` are used for live changes.
- `@insforge/sdk` is used only from the Next.js server runtime with `INSFORGE_API_KEY`. Database RLS blocks public roles on every application table.

### Auth

- JWT cookie auth is implemented with `jose`, a mandatory production secret, HTTP-only cookies, and database-backed session-version checks.
- Accounts support three roles: `ADMIN`, `DRIVER`, `CUSTOMER`.
- `requireSession()` gates dashboard access server-side.
- Password changes, resets, role changes, account anonymization, and secret rotation revoke existing sessions.

### Payments and Notifications

- `lib/payments.ts` creates Stripe Checkout sessions from stored server-side booking totals.
- `/api/webhooks/stripe` requires Stripe signatures and metadata, validates amount/currency, and deduplicates event IDs.
- `lib/notifications.ts` is the abstraction point for email, SMS, or WhatsApp fan-out.

## Schema Summary

Main transfer models:

- `User`: role, identity, contact, password hash
- `CustomerProfile`: billing and preference metadata
- `DriverProfile`: operational metadata and availability base
- `Vehicle`: class, capacity, merchandising summary, features
- `Route`: origin, destination, distance, duration, pricing mode, SEO copy
- `RoutePrice`: per-route, per-vehicle price matrix
- `RideQuote`: bespoke request queue with optional offer
- `Booking`: fixed-price or accepted-quote ride record
- `BookingStop`: multi-stop expansion point
- `Invoice`: issued and paid booking paperwork
- `PaymentTransaction`: gateway transaction record
- `Notification`: outbound communication log
- `AuditLog`: operator change trail

This schema is designed so pricing, assignment, invoice history, and notification state can all be audited later without overloading the main booking record.

## Page Design Map

### Public Pages

- `/`
  - Marketplace hero with airport, city, intercity, and hourly tabs
  - Offer-led conversion modules
  - Location collections with tabbed browsing
  - Fleet positioning and traveler proof
  - Trust CTA into fixed-price booking or quote flow
- `/routes`
  - Indexed route catalog
  - Clear distinction between fixed and quote journeys
- `/fleet`
  - Vehicle listings designed around use cases, not raw spec sheets
- `/book`
  - Fast fixed-price booking form
  - Route and vehicle preview rail
- `/quotes`
  - Bespoke journey intake for complex rides
- `/how-it-works`
  - Workflow explanation for trust and SEO support
- `/destinations/[slug]`
  - Reusable SEO landing page template for route clusters or local service pages
- `/sign-in` and `/sign-up`
  - Account entry and retention layer

### Dashboard Pages

- `/dashboard`
  - Role-aware overview
  - Summary strip
  - Live bookings and quote queue
- `/dashboard/bookings`
  - Booking management table
- `/dashboard/quotes`
  - Quote review table
- `/dashboard/routes`
  - Admin route and price matrix
- `/dashboard/fleet`
  - Admin fleet management surface
- `/dashboard/drivers`
  - Driver assignment overview
- `/dashboard/customers`
  - Customer account visibility
- `/dashboard/invoices`
  - Invoice ledger

## Workflow Design

### 1. Fixed-Price Booking

1. Customer lands on route or homepage.
2. Customer opens `/book`, selects a known route and vehicle.
3. Form submits through a server action.
4. Repository creates or reuses a customer record.
5. Booking record is created with a signed server-verified fare, passenger details, and pickup metadata.
6. Stripe Checkout URL is generated server-side from the stored booking total when payment credentials exist.
7. Notification abstraction queues booking confirmation messages.
8. Booking appears in admin and driver dashboards.

### 2. Quote-Based Journey

1. Customer opens `/quotes`.
2. Customer describes route, schedule, passengers, and preferred vehicle.
3. Quote request enters the queue with `PENDING` status.
4. Admin reviews and prices the ride.
5. Accepted quote can be converted into a booking record.

### 3. Admin Dispatch

1. Admin reviews upcoming bookings.
2. Driver and vehicle capacity are checked.
3. Assignment is recorded against the booking.
4. Notification fan-out informs customer and driver.
5. Invoice and payment status remain visible in the booking lifecycle.

### 4. Customer Account Retention

1. User signs up or is created implicitly when booking in database-backed mode.
2. Customer returns to the dashboard to view bookings, quotes, and invoices.
3. The account becomes the retention anchor for repeat transfers and future automation.

## Deployable Code Structure

- Single Next.js application for public site and internal workspace
- InsForge schema and seed SQL under `insforge/`
- Prisma schema snapshot under `prisma/` for domain reference
- Shared domain, auth, payments, and repository logic under `lib/`
- Route handlers under `app/api/`
- Component slices separated into `marketing`, `booking`, `dashboard`, `auth`, and `ui`

This structure keeps the application deployable as a single web service while still allowing future extraction of workers, background jobs, or provider-specific adapters.

## Scalability Notes

- Public pages default to server rendering for faster first paint and better crawlability.
- Interactive logic is isolated to forms and dashboard actions to keep bundle size contained.
- Repository abstraction allows database reads and writes to be optimized without rewriting the UI.
- Route handler boundaries make it straightforward to expose selected capabilities to native apps, partner portals, or external dispatch systems later.
- Notifications, payments, and invoicing are intentionally separated from page components so they can move to async jobs when volume grows.

## Future enhancements

- Move provider delivery and retry handling into background jobs
- Convert invoice records into downloadable PDF artifacts
- Add driver mobile actions for trip status updates and navigation launch
- Add route-specific rich content and FAQ blocks for local SEO scale
- Add consent-aware analytics, experimentation, and conversion-event tracking
