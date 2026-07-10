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

## 🔵 UX ideas — proposed 2026-07-10 (not started, no code written yet)

Three related ideas around softening destructive actions. Written up in more detail
than usual because they touch several files and a schema change — read this before
starting so the pieces aren't built in the wrong order.

**Suggested build order:** #2 (trash / soft-delete) first, since #1 depends on it —
then #1 (undo toast) — then #3 (Cmd+Z), which should just wire into the same undo
function #1 already built rather than being a separate mechanism.

### 1. Instant delete + 5s "Undo" toast (replace the confirm modal)

Today, deleting a trip shows a blocking confirm dialog first (`confirmDialog()` from
`useDialog()` in `src/components/ui/DialogModal.jsx`, triggered from
`handleDelete()` in `AllTrips.jsx` / `TripsOverview.jsx`) and only then calls
`onDeleteTrip` → `DELETE /api/trips/:id`, which is a **hard**, irreversible delete
today (`server/routes/trips.js`).

New flow: remove the "are you sure?" modal for trip deletion. Clicking delete
removes the trip from the UI immediately (optimistic) and fires the delete request
right away, and a toast appears for 5 seconds with an "Undo" button. If the user
doesn't click Undo, the deletion stands (and the trip lands in Trash — see #2). If
they click Undo, it calls a restore action and the trip reappears.

Key implementation decision: **don't fake the undo client-side** (i.e. don't delay
the real API call until the toast expires) — if the tab is closed or navigated away
mid-toast, a client-only delay would either lose the delete or silently keep it
around. Instead, delete for real immediately via soft-delete (see #2), and "Undo"
just calls the restore endpoint. This also means the same delete action is safe to
reuse for #3's Cmd+Z.

`react-hot-toast` is already the toast library in use (`toast.success(...)`
elsewhere) — it supports a custom render (`toast.custom(...)`) which is what a toast
with a button needs, rather than the plain `toast.success()` calls used today.

Also worth deciding: does this pattern extend to other deletions (expenses,
activities, packing items) or just trips for now? Recommend starting with trips only
and extending the same pattern later, since each one needs its own soft-delete
support server-side.

### 2. Trash for deleted trips (30-day retention, or empty manually)

Requires trips to be soft-deleted instead of hard-deleted:

- New migration adding a nullable `deleted_at` column to `trips` (following the
  existing pattern in `server/migrations/003_security.sql`).
- `DELETE /api/trips/:id` changes from `DELETE FROM trips ...` to
  `UPDATE trips SET deleted_at = NOW() ...`. Related rows (`trip_activities`,
  `trip_expenses`, `trip_packing_items`, `trip_documents`) should stay intact while
  a trip is in the trash — only cascade-delete them at permanent purge time, not at
  soft-delete time — otherwise "restore" can't bring back a fully intact trip.
- Every place that lists a user's trips (`GET /api/trips`, dashboard home, profile,
  etc.) needs a `WHERE deleted_at IS NULL` filter added, or deleted trips will
  reappear in the normal trip list.
- New "Trash" view (new route/page) listing trips where `deleted_at IS NOT NULL`,
  sorted by deletion date, each with "Restore" (clears `deleted_at`) and "Delete
  forever" (hard delete now) actions, plus a bulk "Empty trash" action for
  dumping everything on demand.
- 30-day auto-purge: since this app is deployed serverless on Vercel, the natural
  fit is a Vercel Cron Job hitting a new endpoint (e.g.
  `POST /api/trips/purge-expired`) once a day, which hard-deletes anything with
  `deleted_at < NOW() - INTERVAL 30 DAY`. A lazy check on every visit to the Trash
  page would also work and needs no cron config, but means a trip past 30 days
  could still show in the trash until someone opens that page — cron is the more
  correct choice.

### 3. Cmd+Z / Ctrl+Z to undo recent actions

There's already a global `keydown` listener in `DashboardLayout.jsx` for single-key
nav shortcuts (`n`, `h`, `t`, ...), but it explicitly **ignores** any event where
`ctrlKey || metaKey || altKey || shiftKey` is true — so Cmd/Ctrl+Z currently does
nothing app-side and needs new handling, not a tweak to the existing one.

Recommended shape: a small shared hook (e.g. `useUndoStack`) that holds the single
most recent undoable action as `{ label, undo: () => Promise }`. Any destructive
action (starting with trip delete from #1) pushes onto it when it fires, and both
the toast's "Undo" button and a new global Cmd/Ctrl+Z handler call the *same*
`undo()` function off that stack — so the logic isn't duplicated between the two
entry points. Keep the guard that ignores keydown while focused in a text input
(same as the existing pattern) so this doesn't fight the browser's native text-undo
inside form fields.

Scope this to one action (trip delete) to start. Widening it to other actions
(expenses, activities, etc.) is straightforward once each of those has its own
soft-delete / inverse operation, but don't build the generic version before there's
a second real use case.

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
