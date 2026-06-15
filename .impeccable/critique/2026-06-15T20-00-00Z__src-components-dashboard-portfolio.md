# Portfolio Critique — Dashboard (everything after login)
**Scope:** All dashboard routes — TripsOverview, TripDetail, Statistics, Settings, FriendProfile, Friends (already fixed)
**Date:** 2026-06-15
**Score:** 14/40

---

## Detector findings (automated)
- `DashboardLayout.jsx:188` — `text-gray-900 on bg-blue-500` (active nav item)
- `TripDetail.jsx:271,356,362,368,441,451` — `text-gray-400/500/900 on bg-blue-50` (sidebar active items + info table labels) — 11 instances

---

## P1 — Critical (fix before ship)

### 1. Settings.jsx — eyebrow anti-pattern saturates entire page
**Lines:** 160, 176, 209, 223, 238, 252, 297, 333, 373, 393, 449

The page subtitle (line 160) is a classic eyebrow: `text-[12px] uppercase tracking-widest font-bold text-gray-500`. Every single form field label in Settings uses the same `uppercase tracking-widest` pattern — Avatar, First name, Last name, Bio, Email, Current password, New password, Confirm password. Currency buttons and theme buttons also use `uppercase tracking-widest`. The entire settings page reads as a wall of eyebrow text; there's no typographic relief or hierarchy.

**Fix:** Page subtitle → sentence-case `text-sm font-medium text-gray-500`. Form field labels → `text-[13px] font-medium text-gray-700 dark:text-gray-300` (or `text-sm font-semibold`). Currency/theme button labels → drop `uppercase tracking-widest`, keep `font-bold text-[13px]`.

### 2. FriendProfile.jsx — eyebrow pattern throughout
**Lines:** 128, 156, 160, 237, 284, 297, 302

- Back link (128): `text-[12px] uppercase tracking-widest font-bold` — navigation should not be uppercase-tracked
- Profile stat labels (156, 160): trip count + member since both use `text-[11px] font-bold text-gray-400 uppercase tracking-widest`
- Trip count header (237): `text-[11px] font-bold text-gray-400 uppercase tracking-widest`
- Location tags (284): `text-[10px] font-bold uppercase tracking-widest` — 10px uppercase tracked on pill tags is illegible
- Activity count (297): `text-gray-400 text-[11px] uppercase tracking-widest font-bold`
- View trip link (302): `text-[12px] font-bold uppercase tracking-widest` — interactive links should never be uppercase-tracked

**Fix:** Back link → `text-[13px] font-semibold`. All stat labels → `text-[12px] font-medium`. Location tags → `text-[11px] font-medium` without uppercase. Activity count → `text-[12px] font-medium`. View trip link → `text-[13px] font-semibold` (matches AllTrips / Friends pattern).

### 3. Gray-on-color contrast failures (12 instances)
- `DashboardLayout.jsx:188` — active sidebar nav item: `text-gray-900 on bg-blue-500`. Should be `text-white`.
- `TripDetail.jsx:356,362,368` — active sidebar tool buttons: `text-blue-600 dark:text-blue-400 on bg-blue-50 dark:bg-blue-500/10`. Light mode passes (blue-600 on blue-50 is fine), but the inactive `text-gray-500 on bg-transparent` next to active blue reads washed out.
- `TripDetail.jsx:441,451` — mobile tool selection cards: inactive `text-gray-500 on glass-card` is borderline; active has same blue-600/blue-50 pattern which is fine.
- `TripDetail.jsx:271` — rename button icon: `text-gray-400 on bg-gray-100/bg-blue-50` on hover — OK for hover state but default `text-gray-400` on white is 2.8:1 (fail).
- `TripDetail.jsx:413,419,423` — info table labels: `text-gray-500 text-[11px] font-medium` — 11px is below bold-14px threshold so needs 4.5:1; gray-500 on white is 3.95:1 (fail at 11px non-bold).

**Fix:** DashboardLayout active item → `text-white`. TripDetail info table labels → bump size to `text-[13px]` or bump color to `text-gray-700 dark:text-gray-300`.

### 4. FriendProfile.jsx — no useReducedMotion
**Lines:** 134, 210, 244–249

All three `motion.div` animations (`initial={{ opacity: 0, y: 20 }}`) have no reduced-motion guard. Profile card, private overlay, and trip card stagger all animate unconditionally.

**Fix:** Add `useReducedMotion()` and gate all initial/transition props. Trip cards stagger is also at `delay: index * 0.05` which is fine (capped naturally by 3-column layout), but add `useReducedMotion` guard on the stagger container.

---

## P2 — Polish

### 5. Settings.jsx — password error block missing role="alert"
**Line:** 365–368

`pwdError` renders a styled div with no `role="alert"`. Screen reader users changing their password won't hear error feedback.

**Fix:** Add `role="alert"` to the error div.

### 6. Settings.jsx — form inputs missing id/htmlFor linkage
Form labels in Settings have no `htmlFor` and inputs have no `id`. The `<label>` elements are visually connected but not programmatically linked.

**Fix:** Add `id="settings-first-name"` etc. to inputs and matching `htmlFor` to labels.

### 7. TripsOverview.jsx — stagger too slow
**Line:** 219

`staggerChildren: 0.1` — with 15+ trips in Past tab, the last card takes 1.5s to appear.

**Fix:** `staggerChildren: shouldReduceMotion ? 0 : 0.05`

### 8. TripDetail.jsx — 9px mobile nav labels
**Lines:** 207, 214, 221, 230

`text-[9px] font-semibold` on the bottom mobile tab bar labels (Itinerary / Tools / Details / Save). iOS minimum accessible text is 11px.

**Fix:** `text-[11px]` minimum.

### 9. FriendProfile.jsx — actionLoading is a single boolean
**Line:** 26

Accept and Decline share one `actionLoading` state. If two buttons exist simultaneously (PENDING_RECEIVED state), pressing one disables both but there's no loading spinner on either — just `opacity-50`.

**Fix:** Replace with `pendingAction` string or `Set` (same pattern as Friends.jsx), show a spinner on the active button.

### 10. TripsOverview.jsx — delete button missing aria-label
**Line:** 244

Delete trip button has `title` attribute but no `aria-label`. Titles are not reliably announced by screen readers.

**Fix:** Add `aria-label={t('tripsOverview.delete.title')}`.

---

## What's working well

- **Statistics.jsx** — exemplary: `AnimatedValue` with `sr-only` live region + `useReducedMotion` throughout, stagger is tight (`delay: index * 0.05`), error/loading/empty states all present.
- **TripsOverview.jsx** — countdown widget is smart and adds genuine value; filter + tab UX is clear; reduced motion partially handled.
- **TripDetail.jsx** — very thorough feature set (packing, docs, diary, day planner, sharing); reduced motion absent but the view has no entrance animations anyway; mobile bottom nav is well-conceived.
- **Budget.jsx** (already critiqued separately) — good.
- **Friends.jsx** (already fixed this session) — good.
