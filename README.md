# DHIIL — Find Work. Find Talent. Connect on WhatsApp.

DHIIL is a PWA-first marketplace connecting **clients** (who post jobs) and
**professionals** (who apply to them). DHIIL is the source of truth for all
marketplace state — accounts, profiles, jobs, applications, statuses,
notifications. WhatsApp is the communication bridge: once an application (or
contact request) is saved in DHIIL, the user can continue the conversation
on WhatsApp via a pre-filled `wa.me` link.

## Stack

- **Next.js 14** (App Router, TypeScript) — UI + API routes in one codebase,
  with a clean layered split (UI → API routes → services/lib → Prisma) so a
  future native client (Android/iOS/React Native/Capacitor) can consume the
  same REST API and business logic without a backend rewrite.
- **Prisma + Postgres** (Supabase-hosted) for the real app. Enum-like fields
  stay `String` (validated at the app layer via Zod) rather than native
  Postgres enums, so swapping the `datasource provider` back to `"sqlite"`
  for a zero-dependency local setup is still a drop-in option with no model
  rewrites — see `prisma/test/schema.prisma`, the exact SQLite mirror the
  automated test suite runs against.
- **JWT sessions** in an httpOnly cookie, bcrypt password hashing.
- **Zod** for server-side request validation (defense in depth — never trust
  client-side validation alone).
- **Tailwind CSS**, mobile-first, with a bottom nav on mobile and a classic
  navbar on desktop.
- **Vitest** for unit + integration tests, run against a local SQLite
  mirror of the production schema (see "Database" below for why).

## Getting started

```bash
npm install
cp .env.example .env         # fill in DATABASE_URL (Supabase Postgres) + a real JWT_SECRET
npx prisma generate
npx prisma db push           # syncs prisma/schema.prisma to your Postgres database
npm run dev
```

Visit `http://localhost:3000`.

## Database

Production `DATABASE_URL` points at Postgres (this project is wired to a
Supabase project by default — see `.env.example` for the connection-string
shape). `prisma/schema.prisma` is the single source of truth for the schema.

**Row Level Security** is enabled on every table in Supabase, with real,
narrow policies:
- Public **read-only** access (`anon` + `authenticated`, `SELECT` only — no
  writes) on the tables DHIIL's own public pages already expose to anyone:
  `ProfessionalProfile`, `Skill`, `ProfessionalSkill`, `Portfolio`, and
  `Job` (restricted to `status = 'OPEN'`, mirroring the same visibility
  rule the API enforces for closed/completed jobs).
- **Default deny** (RLS enabled, zero policies, zero grants) on everything
  else — `User`, `Gig`, `Application`, `Notification`, `Favorite`,
  `Review`, `Report`, `Verification` — since DHIIL doesn't use Supabase
  Auth (no `auth.uid()` to key per-user policies off), so those tables are
  only ever reachable through the Next.js API's own JWT-authenticated,
  ownership-checked routes.
- The app's own Postgres role (used by `DATABASE_URL`, i.e. by Prisma) has
  `rolbypassrls = true` — it's the table owner, so none of the above
  affects normal app operation. RLS only governs the `anon`/`authenticated`
  roles Supabase's client libraries and PostgREST use, which this app never
  touches — everything goes through `src/lib/prisma.ts`.

**Tests** run against `prisma/test/schema.prisma`, an exact SQLite mirror of
the production models (kept in lockstep manually — same fields, same
relations, same defaults). `npm test`'s `pretest`/`posttest` hooks swap the
generated `@prisma/client` to/from that mirror automatically so `npm run
dev`/`build` always end up with the Postgres-flavored client again.

## Scripts

- `npm run dev` — start the dev server (regenerates the Postgres-targeted
  Prisma client first)
- `npm run build` / `npm start` — production build + serve
- `npm run lint` — ESLint (Next's config)
- `npx tsc --noEmit` — TypeScript check
- `npm test` — Vitest unit + integration suite (SQLite mirror; regenerates
  the Postgres client again afterward)

## Architecture

```
UI (src/app/**/page.tsx, src/components)
  -> API routes (src/app/api/**/route.ts)
    -> services (src/services) + lib (src/lib: auth, validation, whatsapp, mappers)
      -> Prisma (src/lib/prisma.ts)
        -> Database
```

- **`src/lib/auth.ts` / `src/lib/api-utils.ts`** — JWT sign/verify, password
  hashing, and `requireUser()` / `requireRole()` helpers that resolve
  identity strictly from the verified session cookie. Nothing ever trusts a
  client-supplied user id or role.
- **`src/lib/whatsapp.ts`** — the single WhatsApp service: phone
  normalization (`libphonenumber-js`), `wa.me` link generation, and every
  message template (`APPLICATION`, `JOB_SHARE`, `PROFESSIONAL_CONTACT`,
  `CLIENT_CONTACT`, plus optional shortlisted/accepted follow-ups). No page
  builds a WhatsApp URL by hand.
- **`src/services/notification-service.ts`** — centralized notification
  creation for every marketplace event (new application, shortlisted,
  accepted, rejected, withdrawn, job status changed).
- **`src/types/index.ts`** — the shared DTO/domain types a native client
  would consume from the same API responses, plus the allowed application
  status transition tables (enforced server-side in
  `/api/applications/[id]/status`).

## WhatsApp-first application flow

1. Professional fills in cover letter, proposed price, delivery time,
   optional portfolio — **client-side, but validated again server-side**.
2. `POST /api/jobs/:id/apply` validates authentication + role, job open
   status, self-application, and duplicate application (unique constraint
   on `(jobId, professionalId)`), then **saves the application** and
   **creates a notification** for the client.
3. Only after that does it generate (never send) a WhatsApp link.
4. The UI shows "Application Ready — Continue on WhatsApp", never "Message
   sent" — opening WhatsApp is not proof of delivery, and the code never
   claims otherwise.

The same honest pattern applies to job sharing (`Share on WhatsApp`),
client→professional contact, and professional→client contact.

## What's intentionally out of scope for this milestone

- Real-time in-app messaging (the DB models a lightweight `Notification`,
  not a chat system) — per the spec, WhatsApp is the MVP's primary
  communication channel.
- Payments/escrow.
- File uploads (portfolio/avatar images are stored as URLs, not uploaded
  binaries) — swapping in real object storage is additive, not a rewrite.
