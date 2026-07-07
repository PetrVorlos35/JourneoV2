# Journeo V2 — Audit Findings & Remaining Work

This file tracks the outcome of a full security / design / performance audit and the
work still outstanding, so future sessions have context. Last updated: **2026-07-07**.

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

## 🔴 Remaining — Security

- **Add security headers / CSP.** No `helmet`, no Content-Security-Policy, no `X-Frame-Options`
  (clickjackable, no XSS defense-in-depth). Add `helmet` to the Express app in `server/index.js`
  and a CSP. Requires `npm i helmet` in `server/`.
- **JWT lifecycle.** Tokens are 30-day, non-revocable, stored in `localStorage`. Changing a
  password does not invalidate existing tokens. Add a `token_version` column on `users`
  (bump on password change / logout-all) and include it in the JWT, or move to short-lived
  access + refresh tokens.
- **Unify password policy.** Registration requires only 6 chars (`auth.js` register), while
  reset/change require 8 + uppercase + digit. A weak password set at registration can't be
  reset to itself. Apply the stronger rule everywhere.
- **Rate limiting is per-instance.** `express-rate-limit` uses in-memory counters; on Vercel
  each warm lambda has its own, so limits are effectively multiplied by instance count. Move
  to a shared store (Redis / Upstash) for real enforcement. (OTP cooldown is already DB-backed
  and fine.)

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
