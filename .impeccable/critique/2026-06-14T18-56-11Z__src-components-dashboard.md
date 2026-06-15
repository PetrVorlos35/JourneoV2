---
target: dashboard
total_score: 23
p0_count: 0
p1_count: 2
timestamp: 2026-06-14T18-56-11Z
slug: src-components-dashboard
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Generating state handled well; unsaved-changes context works; missing explicit auto-save signal |
| 2 | Match System / Real World | 3 | "Activities" and categorized tabs feel natural; minor jargon risk on empty states |
| 3 | User Control and Freedom | 3 | Confirm-before-delete ✓, back navigation ✓; no undo for packing/doc deletions |
| 4 | Consistency and Standards | 3 | Glass surface is cohesive; `border-l-4` in CreateTripModal is the one outlier |
| 5 | Error Prevention | 2 | Confirm dialog for delete; no inline form validation detected on create-trip flow |
| 6 | Recognition Rather Than Recall | 3 | Nav labels visible on both desktop and mobile; filter reset appears contextually |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts; no bulk-select/delete; single rigid path to every action |
| 8 | Aesthetic and Minimalist Design | 2 | Every region gets the same `glass-card` surface — nothing reads as primary |
| 9 | Error Recovery | 2 | Toast success/error present; trip-not-found state is minimal; API failure copy not audited |
| 10 | Help and Documentation | 1 | No help, tooltips, contextual hints, or guided empty states that teach |
| **Total** | | **23/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**Does this look AI-generated?** Yes — primary tells:
1. Glassmorphism as default (not accent). Every surface uses `glass-card`.
2. Hero-metric template twice: countdown (giant number + label) and Quick Stats (two big numbers).
3. Tiny uppercase tracked eyebrows on stat widgets: `UPCOMING TRIP`, `YOUR STATS` — `uppercase tracking-widest font-bold`.
4. Two decorative `animate-pulse` blur orbs with no informational purpose.

**Deterministic scan — 14 findings:**

| Pattern | Count | Files |
|---------|-------|-------|
| `gray-on-color` | 12 | `TripDetail.jsx` (L271, 356×2, 362×2, 368×2, 441×2, 451×2), `DashboardLayout.jsx` (L160) |
| `side-tab` | 1 | `CreateTripModal.jsx` L255 (`border-l-4`) |
| `bounce-easing` | 1 | `TripDetail.jsx` L102 (`animate-bounce`) |

## Overall Impression

Functional and thematically committed — dark glassmorphism never breaks, data model maps to UI correctly. But doesn't feel considered; feels like a component library applied uniformly. Biggest opportunity: differentiate surface weight so the trip list reads as primary content.

## What's Working

1. Countdown widget earns its position — days-until-next-trip is the right emotional hook.
2. Mobile horizontal card carousel is smart UX vs. a stacked grid.
3. Contextual filter reset (only appears when filters are active).

## Priority Issues

**[P1] Every surface has the same visual weight**
- `glass-card` applied to sidebar, countdown, stats, action buttons, filter bar, trip cards, empty state, mobile slide-over. Users can't parse primary content vs. chrome.
- Fix: 3-tier surface vocabulary. Base (page bg), Secondary (glass for utility regions), Elevated (distinct treatment for trip cards and countdown).
- Command: `/impeccable layout`

**[P1] Hero-metric templates on stat widgets**
- Quick Stats card (two big numbers) + countdown card both hit the banned hero-metric pattern.
- `places_visited` is nearly always 0 (location field rarely filled) — pure noise.
- Fix: Collapse Quick Stats to a compact info row. Don't use `uppercase tracking-widest` labels as identifiers inside cards.
- Command: `/impeccable distill`

**[P2] Gray text on blue-tinted backgrounds in TripDetail** *(detector: 12 hits)*
- `text-gray-400`/`text-gray-500`/`text-gray-900` on `bg-blue-50` fails WCAG AA in light mode (~2.5:1 for gray-400 on blue-50).
- Fix: Replace with `text-blue-700`/`text-blue-600`/`text-blue-900` inside `bg-blue-50` contexts.
- Command: `/impeccable audit`

**[P2] Decorative background blur orbs — always-on animation**
- Two `animate-pulse` gradient blobs with no informational role and no `prefers-reduced-motion` guard.
- Fix: Wrap in `useReducedMotion()` guard or remove. Add `aria-hidden="true"`.
- Command: `/impeccable animate`

**[P2] No path to efficiency for returning users**
- No keyboard shortcuts, no bulk-select, no recent/pinned trips. Home → packing list = 4+ taps.
- Fix: "Continue planning" CTA on home screen deep-linking to last trip. Keyboard shortcut hints.
- Command: `/impeccable delight`

## Persona Red Flags

**Alex (Power User)**
- No keyboard shortcuts for any action.
- Delete button is hover-reveal (`opacity-0 → group-hover:opacity-100`) — inaccessible via keyboard.
- "New Trip" exists in 3 places with inconsistent breakpoint visibility — signals unclear ownership.

**Sam (Accessibility)**
- Mobile nav: `title={item.label}` not reliable for screen readers; needs `aria-label`.
- Decorative blur orbs missing `aria-hidden="true"`.
- `animate-bounce` has no `prefers-reduced-motion` guard.
- Theme toggle 3-segment needs `role="radiogroup"` semantics to announce correctly.

**Project-Specific: "The Pre-Trip Checker"** (solo traveler, mobile, 2 days before departure)
- Opens app to check packing list — requires 4 taps minimum from home to packing.
- Bottom nav has no "Continue planning" or direct packing shortcut.
- `totalVisitedPlaces` almost always 0 for new users; stat widget is meaningless noise to them.

## Minor Observations

- `CreateTripModal.jsx` L255: `border-l-4` — one-line fix, replace with bg tint or remove.
- `TripDetail.jsx` L102: `animate-bounce` on MapPin inside spinner — remove, keep `animate-spin` on ring.
- `DashboardLayout.jsx` L160: `text-gray-900 on bg-blue-500` — use `text-white`.
- FAB `bottom-24` clearance above mobile nav — verify at 375px viewport height.
- Stagger entrance animations gated on `initial="hidden"` opacity:0 — verify no blank-card flash on slow renders.
