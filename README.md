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
- **Prisma + SQLite** for local/sandbox development (zero external
  dependencies). The schema deliberately avoids Postgres-only features, so
  switching `prisma/schema.prisma`'s `datasource provider` to `"postgresql"`
  and pointing `DATABASE_URL` at a real Postgres instance is the entire
  production migration — no model rewrites.
- **JWT sessions** in an httpOnly cookie, bcrypt password hashing.
- **Zod** for server-side request validation (defense in depth — never trust
  client-side validation alone).
- **Tailwind CSS**, mobile-first, with a bottom nav on mobile and a classic
  navbar on desktop.
- **Vitest** for unit + integration tests (route handlers are exercised
  directly against a real Prisma-backed SQLite test database).

## Getting started

```bash
npm install
cp .env.example .env   # fill in a real JWT_SECRET for anything but local dev
npx prisma db push     # creates prisma/dev.db from the schema
npm run dev
```

Visit `http://localhost:3000`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm start` — production build + serve
- `npm run lint` — ESLint (Next's config)
- `npx tsc --noEmit` — TypeScript check
- `npm test` — Vitest unit + integration suite

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
