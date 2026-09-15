# Show&Tell

The running record of what [Malaysian AI](https://www.malaysian.ai/) builders
are building — a private tracker for the
[Weekly Show & Tell](https://luma.com/malaysianai) at the Malaysian AI Residency
(Thursdays, 5–6PM, 500 Global Office, AICB, KL — 4 min demo + 2 min feedback
per person).

It records members, meetups, projects, and the talks ("updates") given about
each project during the Show & Tell slot — with derived engagement signals like
*meetups since last talk*, so you can see which projects are still moving and
who has gone quiet. It also runs the room: a QR code people scan to put their
name in the presenting order, and a projected timer for each talk.

Built with **Next.js 16 (App Router)**, **Convex**, **Clerk**, **Tailwind CSS
v4**, and **Zustand**. Every screen follows [`design.md`](./design.md), the
Malaysian AI design system.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Link and push the Convex backend (writes `NEXT_PUBLIC_CONVEX_URL` to
   `.env.local`):

   ```bash
   npx convex dev
   ```

3. Configure Clerk:
   - Put `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in
     `.env.local`, and enable Google sign-in.
   - In Clerk's "Customize session token", map the `email` and
     `email_verified` claims — Convex authorizes on them.
   - Tell Convex which issuer to trust:
     `npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer>`.

4. For dictated updates, put `OPENAI_API_KEY` in `.env.local`.

5. Create the first admin (every other way to grant access needs an admin):

   ```bash
   npx convex run bootstrap:grantAccess '{"email":"you@example.com","accessLevel":"admin"}'
   ```

6. Optionally seed demo data into an empty database (~40 members, ~45 meetups,
   ~30 projects, ~200 updates):

   ```bash
   npx convex run seed
   ```

7. Run the app:

   ```bash
   npm run dev
   ```

Sign in at `/login` with a Google account whose email is on the roster with an
access level. Admins can edit everything; members are read-only.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server (run `npx convex dev` alongside for live function pushes) |
| `npm run build` | Production build |
| `npm test` | Vitest: metrics and summariser unit tests + Convex function tests (auth, cascades, present) |
| `npm run lint` | ESLint |

## Architecture notes

- **Auth**: Clerk authenticates; the `members` table authorizes. Every query
  and mutation re-checks the caller server-side (`convex/lib/auth.ts`), and
  writes require an admin.
- **Metrics**: per-member engagement metrics are derived on read, never stored
  (`convex/lib/metrics.ts`).
- **Live UI**: Convex subscriptions — a write in one tab appears in others
  without refresh.
- **Present**: `/present` (admin) shows a QR code for the current session;
  `/join/[code]` lets anyone holding the code add their name and watch their
  place in the queue, without signing in.
- **Dictation**: `/api/transcribe` transcribes a recording with OpenAI and,
  for a whole talk, condenses it into an update. New updates are queued and
  saved in the background (`lib/transcription-queue.ts`).
- **Theme**: every colour is a `light-dark()` token in `app/globals.css`. The
  System / Light / Dark choice is stored in `localStorage['malaysianai-theme']`
  and stamped on `<html>` as `data-theme` before first paint.
