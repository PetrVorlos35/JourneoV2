# Journeo V2 — Audit Findings & Remaining Work

This file tracks the outcome of a full security / design / performance audit and the
work still outstanding, so future sessions have context. Last updated: **2026-07-07**.

---

## ⚠️ Deploy note — migration 003 must run BEFORE deploying (2026-07-07)

The security fixes below require `server/migrations/003_security.sql` (adds
`users.token_version` + `rate_limits` table). **The new code breaks login with
"Unknown column 'token_version'" until the migration runs.** Apply with:

```sh
mysql -h db.dejny.eu -u vorel -p voreldb < server/migrations/003_security.sql
```

Idempotent — safe to run repeatedly. (Automated run was blocked by permissions;
must be run manually.) Existing JWTs keep working (missing `tv` claim counts as
version 0); they die on the user's next password change/reset.

---

## ✅ Deploy note (resolved 2026-07-07)

The Google login fix **fails closed**: it rejects Google sign-in unless the server can see
the OAuth client ID via a server-side `GOOGLE_CLIENT_ID` env var (falls back to
`VITE_GOOGLE_CLIENT_ID`, which on Vercel is build-time only).

- Local `.env` — **done** (`GOOGLE_CLIENT_ID` added, verified resolving at runtime).
- Vercel production env var — **done** (set by the user).

If Google login ever returns HTTP 500 again, re-check that `GOOGLE_CLIENT_ID` is present in
the Vercel environment for the target deployment. Email/password login is unaffected either way.

---

## ✅ Fixed in this session

1. **Google OAuth account-takeover (critical).** `POST /api/auth/google` now verifies the
   access token was issued for *this* app (checks `aud`/`azp` from Google's `tokeninfo`)
   before trusting the email. Previously any Google access token from any OAuth app could
   be replayed to log in as an arbitrary Journeo user. — `server/routes/auth.js`
2. **CORS wildcard removed.** No longer falls back to `origin: '*'` with `credentials: true`;
   uses an explicit allowlist (`FRONTEND_URL`, prod domain, localhost). — `server/index.js`
3. **Email HTML injection.** User-controlled names / trip titles are now HTML-escaped before
   being interpolated into notification emails. — `server/lib/mailer.js`
4. **Fake "generating" theater removed (design).** Creating a trip no longer waits on a
   hardcoded 4s `setTimeout` that pretended to do AI processing; the trip appears and the
   success toast fires immediately. Dead "generating" screen removed from TripDetail.
   — `src/components/dashboard/DashboardHome.jsx`, `src/components/dashboard/TripDetail.jsx`
5. **`GET /api/trips` N+1 eliminated (performance).** Was ~7 queries per trip (saturated the
   15-connection pool under light concurrency); now a constant ~7 batched `WHERE trip_id IN (…)`
   queries regardless of trip count. Response shape unchanged. — `server/routes/trips.js`

---

## ✅ Security — fixed 2026-07-07 (requires migration 003, see deploy note)

1. **Security headers / CSP.** `helmet` added to the Express API (`server/index.js`) with a
   strict API CSP (`default-src 'none'`, `frame-ancestors 'none'`, XFO deny). The static
   frontend gets its headers from `vercel.json` → CSP allowing only self + Google
   fonts/OAuth + Nominatim (+ any https for avatar images), `frame-ancestors 'none'`,
   HSTS, nosniff, Referrer-Policy, Permissions-Policy.
2. **JWT revocation via `token_version`.** JWTs now carry a `tv` claim checked against
   `users.token_version` in `middleware/auth.js` / `adminAuth.js` (one PK lookup per
   request). Password change/reset bumps the version → all older tokens die.
   Change-password returns a fresh token so the current session stays logged in
   (`AuthContext.jsx` stores it). Pre-existing tokens (no `tv`) count as version 0.
3. **Password policy unified.** Registration now enforces the same 8 + uppercase + digit
   rule as reset/change (frontend already did).
4. **Auth rate limiting is now cross-instance.** `authLimiter` uses a MariaDB-backed store
   (`server/lib/dbRateStore.js`, `rate_limits` table) so login/register limits hold across
   warm lambdas; fails open on DB errors. The global 300/min limiter stays in-memory by
   design (coarse flood guard, not worth a DB query per request).

## 🟠 Remaining — Design / Correctness

- **Hardcoded, stale exchange rates (data corruption risk).** `EXCHANGE_RATES` in
  `DashboardHome.jsx` is a static table; the "convert currency" action rewrites every
  expense amount in the DB using these fixed rates and is lossy/irreversible. Either fetch
  live rates, or (better) store amounts in one canonical currency + a currency field and
  convert only for display. Highest-value remaining correctness item.
- **`--font-serif` is aliased to Inter** in `src/index.css` (the app loads DM Serif Display &
  Caveat but the serif token silently resolves to sans). Token is currently unused — either
  wire it to a real serif or remove it.
- **Reduce server console noise.** ~138 `console.*` calls server-side, including logging DB
  host on boot. Gate behind a debug flag or strip for production.

## 🟡 Remaining — Performance / Scaling

- **Main JS bundle is 583 KB (188 KB gzip).** `framer-motion` + `gsap` + `i18next` all in the
  initial chunk. Configure `build.rollupOptions.output.manualChunks` to split vendor libs; lazy
  load `gsap`/`framer-motion`-heavy views.
- **Unoptimized hero images.** `src/assets/auth_bg.png` (770 KB) and `hero_travel.png` (877 KB)
  ship as raw PNG. Convert to WebP/AVIF (~1.5 MB saving on those two alone).
- **Serverless connection-pool math.** `connectionLimit: 15` per lambda × N warm lambdas can
  exceed MariaDB `max_connections`. Lower per-instance limit and/or front the DB with a pooler.
- **Friend search does `LIKE '%term%'`** (`friends.js`) — unindexable full scan. Fine now; add a
  FULLTEXT index or search service before tens of thousands of users.
- **Other endpoints still have smaller N+1s** worth batching later: `GET /api/profile/:userId`
  (per-trip activity + vote queries) and the profile trip detail. Lower priority than the trips
  list, which was the hot path.

## Scaling verdict
Fine for hundreds of users. The `/api/trips` N+1 (now fixed) was the first thing that would
break under concurrent dashboard loads. Next scaling limits are the per-instance rate limiting
and the serverless connection-pool math.
