# Journeo V2 — Audit Findings & Remaining Work

This file tracks the outcome of a full security / design / performance audit and the
work still outstanding, so future sessions have context. Last updated: **2026-07-10**.

---

## ✅ Deploy note — migration 003 applied (2026-07-07)

`server/migrations/003_security.sql` (adds `users.token_version` + `rate_limits`
table) was run by the user on the production DB. The security fixes below depend
on it — if login ever returns "Unknown column 'token_version'", re-run the
migration (idempotent). Existing JWTs keep working (missing `tv` claim counts as
version 0); they die on the user's next password change/reset.

## ✅ Deploy note — Google login env var (resolved 2026-07-07)

The Google login fix **fails closed**: it rejects Google sign-in unless the server can see
the OAuth client ID via a server-side `GOOGLE_CLIENT_ID` env var (falls back to
`VITE_GOOGLE_CLIENT_ID`, which on Vercel is build-time only). Set in local `.env` and in
Vercel production env. If Google login ever returns HTTP 500 again, re-check that
`GOOGLE_CLIENT_ID` is present in the Vercel environment for the target deployment.
Email/password login is unaffected either way.

## ℹ️ Deploy note — optional new env var (2026-07-09)

`DB_POOL_LIMIT` — per-instance MariaDB connection pool size, defaults to **5**
(was hardcoded 15). Raise it only for a long-running (non-serverless) deployment.

## ✅ Deploy note — migration 004 + CRON_SECRET applied (2026-07-10)

`server/migrations/004_trash.sql` (adds nullable `trips.deleted_at` + index) was run
by the user on the production DB, and `CRON_SECRET` was set in both local `.env` and
Vercel production env. The trash / undo-delete feature (see UX section below) depends
on both — if deleting a trip ever returns "Unknown column 'deleted_at'" again, re-run
the migration (idempotent). If the daily purge cron (`GET /api/cron/purge-trash`,
03:30 UTC) ever 401s, re-check `CRON_SECRET` is present in the Vercel environment for
the target deployment — it fails closed without it. Even without the cron running,
expired trips are purged lazily per-user whenever their Trash page loads.

---

## ✅ Security — fixed 2026-07-07 (requires migration 003)

1. **Google OAuth account-takeover (critical).** `POST /api/auth/google` verifies the
   access token was issued for *this* app (checks `aud`/`azp` from Google's `tokeninfo`)
   before trusting the email. — `server/routes/auth.js`
2. **CORS wildcard removed.** Explicit origin allowlist (`FRONTEND_URL`, prod domain,
   localhost); never falls back to `*` with credentials. — `server/index.js`
3. **Email HTML injection.** User-controlled names / trip titles are HTML-escaped before
   interpolation into notification emails. — `server/lib/mailer.js`
4. **Security headers / CSP.** `helmet` on the Express API (strict `default-src 'none'`);
   frontend headers via `vercel.json` (CSP, HSTS, nosniff, Referrer-Policy, etc.).
5. **JWT revocation via `token_version`.** `tv` claim checked against `users.token_version`
   on every request; password change/reset bumps it. Change-password returns a fresh token.
6. **Password policy unified.** Registration enforces the same 8 + uppercase + digit rule
   as reset/change.
7. **Auth rate limiting is cross-instance.** `authLimiter` backed by MariaDB
   (`server/lib/dbRateStore.js`, `rate_limits` table); fails open on DB errors. The global
   300/min limiter stays in-memory by design.

## ✅ Design / Correctness — fixed 2026-07-09

1. **Live exchange rates (was: hardcoded stale table).** Currency conversion no longer
   uses a static `EXCHANGE_RATES` table in the client. New endpoint
   `GET /api/settings/exchange-rate?from=X&to=Y` (`server/routes/settings.js`) fetches the
   current ECB rate from frankfurter.dev, caches it in memory for 1 h, validates currencies
   against an allowlist, and **fails closed** (HTTP 502) when the rate can't be fetched —
   because the conversion rewrites every expense amount in the DB irreversibly, no
   conversion happens on a missing rate. The client (`DashboardHome.jsx`) aborts with an
   error toast in that case, and `Settings.jsx` only switches the displayed currency after
   the amounts were actually recalculated. Note: storing amounts in one canonical currency
   and converting only for display would still be architecturally cleaner (conversion
   remains lossy due to rounding), but the data-corruption risk from stale rates is gone.
2. **`--font-serif` token removed** from `src/index.css` (it silently aliased Inter and
   was unused).
3. **Server console noise.** `server/lib/quietLogs.js` (imported first in
   `server/index.js`) silences `console.log/info/debug` in production unless `DEBUG` is
   set; `warn`/`error` always pass through. The DB host is no longer logged anywhere.
4. *(2026-07-07)* **Fake "generating" theater removed.** Trip creation no longer waits on
   a hardcoded 4 s `setTimeout`.

## ✅ Performance — fixed 2026-07-09

1. **Main JS bundle split: 583 KB → 298 KB (188 → 94 KB gzip).**
   `build.rollupOptions.output.manualChunks` in `vite.config.js` splits `react-vendor`
   (50 KB), `motion`/framer-motion (137 KB), and `i18n` (57 KB) into separately cached
   chunks; `AuthFlow` is now lazy-loaded in `App.jsx`. **`gsap` was removed entirely** —
   it was in `package.json` but imported nowhere.
2. **Hero images.** `src/assets/auth_bg.png` (756 KB) was referenced nowhere — deleted.
   `hero_travel.png` (860 KB) converted to `hero_travel.webp` (148 KB, visually clean).
   Caveat: its only consumer, `src/components/ui/HorizontalScrollCarousel.jsx`, is itself
   imported by nothing (dead code, kept in case it's planned work — see Remaining).
3. **Serverless connection-pool math.** Per-instance `connectionLimit` lowered 15 → 5
   (override with `DB_POOL_LIMIT`), so N warm lambdas are far less likely to exhaust
   MariaDB `max_connections`. — `server/config/db.js`
4. **Profile N+1 eliminated.** `GET /api/profile/:userId` fetched activities + the
   viewer's vote per trip (2 queries × N trips); now 2 batched `WHERE trip_id IN (…)`
   queries. `GET /api/profile/:userId/trip/:tripId` runs its 7 independent sub-queries in
   one `Promise.all` instead of sequentially. Response shapes unchanged.
   — `server/routes/profile.js`
5. *(2026-07-07)* **`GET /api/trips` N+1 eliminated** — constant ~7 batched queries
   regardless of trip count. — `server/routes/trips.js`

## ✅ UX — implemented 2026-07-10 (requires migration 004, see deploy note above)

All three "softening destructive actions" ideas are built, in the planned order
(#2 trash → #1 undo toast → #3 Cmd+Z on the same undo function):

1. **Instant delete + 5s Undo toast.** The confirm modal is gone from trip deletion
   (`AllTrips.jsx`, `TripsOverview.jsx`). `handleDeleteTrip` in `DashboardHome.jsx`
   removes the trip optimistically, fires the soft-delete immediately (no client-side
   fake delay — closing the tab mid-toast can't lose the delete), and shows a 5 s
   `react-hot-toast` toast whose Undo button calls `POST /api/trips/:id/restore` and
   puts the kept trip object back into state. If the delete request itself fails, the
   optimistic removal is rolled back and the undo offer withdrawn. Scoped to trips
   only, as recommended.
2. **Trash with 30-day retention.** `server/migrations/004_trash.sql` adds nullable
   `trips.deleted_at` (+ index). `DELETE /api/trips/:id` now soft-deletes; child rows
   stay intact until purge (hard delete cascades them). New endpoints:
   `GET /api/trips/trash`, `POST /api/trips/:id/restore`, `DELETE /api/trips/:id/permanent`,
   `DELETE /api/trips/trash` (empty). `deleted_at IS NULL` filters added to `getTripRole`
   and every trip listing: `GET /api/trips`, profile, public share link, votes, all
   stats queries. Trash page at `/dashboard/trash` (`Trash.jsx`, linked from AllTrips)
   with per-trip Restore / Delete forever, Empty trash, and days-left badges.
   Purge: daily Vercel Cron (`vercel.json` → `GET /api/cron/purge-trash`,
   `server/routes/cron.js`, CRON_SECRET-guarded, fails closed) **plus** a lazy per-user
   purge on Trash page load as a no-config fallback. Admin routes intentionally still
   see trashed trips.
3. **Cmd/Ctrl+Z.** `src/hooks/undoStack.js` holds the single most recent undoable
   action; both the toast's Undo button and a new Cmd/Ctrl+Z branch in
   `DashboardLayout.jsx`'s keydown listener call the same `undo()`. The text-input
   guard runs first, so native text-undo in form fields is untouched. Trip delete is
   the only producer for now — widen only when a second real use case exists.

Note: Settings → "clear all data" still deletes trips one-by-one, so those now land
in the trash too (restorable) instead of vanishing — arguably an improvement, but
worth remembering.

## 🟡 Remaining — deliberately deferred

- **Friend search does `LIKE '%term%'`** (`friends.js`) — unindexable full scan. Fine at
  current scale; add a FULLTEXT index or search service before tens of thousands of users.
- **Canonical-currency storage.** See Design fix #1 — live rates fixed the corruption
  risk, but a schema where amounts live in one currency (+ display conversion) would make
  conversion non-destructive. Schema + migration work, do when touching expenses next.
- **`HorizontalScrollCarousel.jsx` is dead code** (nothing imports it). Kept because it
  looks like planned landing-page work (see `scrollytelling.md`); delete it and
  `hero_travel.webp` if that plan is abandoned.
- **DB pooler.** If warm-lambda counts grow, front MariaDB with a connection pooler
  (ProxySQL / MaxScale) instead of tuning `DB_POOL_LIMIT` further.
- **Lint debt.** `npm run lint` reports ~484 pre-existing errors (mostly unused vars);
  not introduced by the audit fixes, worth a dedicated cleanup pass.

## Scaling verdict

Fine for hundreds of users. The `/api/trips` and profile N+1s (now fixed) were the first
things that would break under concurrent dashboard loads; per-instance pool size is now
serverless-safe. Next scaling limits are the friend-search full scan and fronting the DB
with a real pooler.
