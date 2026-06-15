---
target: statistics
total_score: 23
p0_count: 0
p1_count: 2
p2_count: 2
p3_count: 1
timestamp: 2026-06-15T11-46-15Z
slug: src-components-dashboard-statistics-jsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading spinner + text, empty state, loaded state — API failure invisible |
| 2 | Match System / Real World | 3 | Labels clear, icons reinforce meaning, categories user-friendly |
| 3 | User Control and Freedom | 2 | Read-only aggregate, no date filter, no drilldown, no export |
| 4 | Consistency and Standards | 2 | Eyebrow styling on every label contradicts updated TripsOverview; all 9 surfaces glass-card, no hierarchy |
| 5 | Error Prevention | 3 | Empty state, ?? 0 fallbacks, try/catch on date math |
| 6 | Recognition Rather Than Recall | 3 | Stats self-labelled, category legend, icons match meaning |
| 7 | Flexibility and Efficiency | 1 | Pure read-only, no filters, no drilldown, no export |
| 8 | Aesthetic and Minimalist Design | 2 | Eyebrows on all labels, glassmorphism everywhere, identical card grids, hero-metric financial number |
| 9 | Error Recovery | 2 | API failure swallowed silently — zeros indistinguishable from no data |
| 10 | Help and Documentation | 2 | "Community score" unexplained; no tooltips |
| **Total** | | **23/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**Does this look AI-generated?** Yes. The page has the full 2023 scaffold: eyebrow on every card (10 instances), hero-metric financial number with counter animation, identical 4-card grids (×2), and glassmorphism on all 9 surfaces. The eyebrow is baked into MetricCard (line 67) and HighlightCard (line 91) as fixed className strings.

**Deterministic scan**: Exit 0, zero findings. Eyebrow pattern is CSS, not a banned class name.

## Overall Impression

Good data model (expense breakdown, packing discipline, favorite month, community score) — the data is interesting, the presentation is the first-pass AI reflex. Gap between this and the updated TripsOverview is visible at a glance.

## What's Working

1. **Expense breakdown bar**: proportional stacked bar with color-coded legend — information-dense, correct visualization choice.
2. **HighlightCard data model**: longest trip, packing discipline, favorite month, most popular — non-obvious stats that reward returning users.
3. **Empty and loading states**: both handled explicitly with spinner + text and try/catch/finally.

## Priority Issues

**[P1] No reduced-motion guards**
- What: AnimatedValue (line 32) uses setInterval counter with no prefers-reduced-motion check. MetricCard and HighlightCard use initial={{ opacity: 0, y: 16 }} with no useReducedMotion(). ExpenseBar animates width from 0 with no guard. Entire page is unguarded while rest of dashboard has useReducedMotion() throughout.
- Why: Vestibular disorder users with prefers-reduced-motion see counting numbers, sliding cards, growing bars.
- Fix: useReducedMotion() in MetricCard/HighlightCard; matchMedia check in AnimatedValue useEffect; guard ExpenseBar width animation.
- Command: /impeccable animate Statistics

**[P1] Eyebrow baked into both sub-components**
- What: MetricCard line 67 and HighlightCard line 91 hardcode uppercase tracking-widest font-bold on label paragraphs. Page header adds another at line 218 (plus loading/empty duplicates). 10 eyebrows on screen.
- Why: Removed from TripsOverview and TripDetail; Statistics now stands out as the old-aesthetic page. Sub-components make it structural.
- Fix: Change to font-medium text-[11px] in both sub-components. Remove page header eyebrow — h1 stands alone.
- Command: /impeccable audit Statistics

**[P2] API failure invisible to user**
- What: fetchStats catches error, logs to console, sets loading=false with no error state. Page renders zeros — identical to new user with no trips.
- Why: User can't distinguish failed load from no data. Silent data-integrity scare.
- Fix: Add error state. On catch, setError(true). Render error card with "Couldn't load statistics" + retry button.
- Command: /impeccable harden Statistics

**[P2] Glass-card on every surface, no hierarchy**
- What: All 4 MetricCards, 4 HighlightCards, and financial section use glass-card. Nine equal-weight surfaces.
- Why: No scannable priority. Financial section (most important) reads at same weight as Community Score: 0.
- Fix: Financial section → content tier (glass-card). MetricCards → utility tier (border-only). HighlightCards → content tier for 2 important, utility for 2 lesser.
- Command: /impeccable layout Statistics

**[P3] Locale hardcoded to cs-CZ in AnimatedValue**
- What: displayed.toLocaleString('cs-CZ') at line 48 — Czech number formatting regardless of i18n setting.
- Fix: Use i18n.language from useTranslation() or pass locale as prop.
- Command: /impeccable harden Statistics

## Persona Red Flags

**Alex (Power User)**: No date-range filter, no year selector, no per-trip breakdown. Community score is 0 with no explanation. Leaves in 10 seconds.

**Riley (Stress Tester)**: API failure shows all zeros — indistinguishable from no data, triggers a support ticket. AnimatedValue formats 1234 as Czech "1 234" in English locale.

**Sam (Accessibility-Dependent)**: AnimatedValue fires ~30 live-region updates per metric (120 total on page load) with no reduced-motion opt-out. Expense bar percentages animate from 0 — meaningful data conveyed through motion alone.

## Minor Observations

- darkColor in CATEGORY_CONFIG defined for all 5 categories but never used — dead code.
- Loading and empty states duplicate the page header eyebrow (needs cleanup too).
- Financial card icon uses hardcoded inline rgba style instead of the glowColor pattern used by other cards.
- Packing discipline shows both emptyText="—" and a subValue "no items" string simultaneously when items=0.
