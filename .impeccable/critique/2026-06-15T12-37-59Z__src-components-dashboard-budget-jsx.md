---
target: budget
total_score: 25
p0_count: 0
p1_count: 3
p2_count: 1
p3_count: 1
timestamp: 2026-06-15T12-37-59Z
slug: src-components-dashboard-budget-jsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Toast confirms add/delete; no budget limit / progress vis |
| 2 | Match System / Real World | 3 | Clear categories + icons; date format inconsistency (short vs long month) |
| 3 | User Control and Freedom | 2 | No edit (delete + recreate only); no undo on confirmed delete |
| 4 | Consistency and Standards | 2 | 12+ eyebrows intact; cs-CZ hardcoded while Statistics now uses i18n; post-cleanup inconsistency is most visible here |
| 5 | Error Prevention | 3 | Delete dialog, required fields, CharCount, min 0.01 ✓ |
| 6 | Recognition Rather Than Recall | 3 | Category icons, filter/search visible, trip selector ✓ |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcut for add, no bulk delete, no edit, no export |
| 8 | Aesthetic and Minimalist Design | 2 | Eyebrow reflex on every element + hero-metric template on summary; sketch annotation adds personality but adds noise |
| 9 | Error Recovery | 3 | Toast errors, form validation, modal preserves state ✓ |
| 10 | Help and Documentation | 2 | Sketch hint is clever; no other in-context guidance |
| **Total** | | **25/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: Yes, unmistakably AI-generated. Budget is the most eyebrow-saturated page in the app — 12+ instances at `uppercase tracking-widest font-bold` across page subtitle (line 272), all three summary card labels (lines 364/368/371), CategoryBar legend items (line 219), "History" section header (line 437), expense item category labels (line 458), delete button text (line 474), and all four form field labels in the modal (lines 102/118/131/149). The three summary cards also nail the hero-metric template exactly (eyebrow → big number). Statistics and TripDetail have already had eyebrows cleaned up; Budget now stands alone as the old-aesthetic page.

**Deterministic scan**: Exit 0, zero findings. The eyebrow pattern uses Tailwind utility classes the scanner doesn't flag deterministically.

## Overall Impression

The data model is solid — per-trip expenses, category breakdown, search/filter, trip date context in the picker — and the animated sketch annotation pointing at the trip selector is a genuine personality beat. The critical gap is that the presentation layer is untouched from first-pass AI output: every label is an eyebrow, the main summary card is the hero-metric cliché, and formatCurrency hardcodes 'cs-CZ'. The biggest single opportunity is the eyebrow sweep.

## What's Working

1. **Sketch annotation on the trip selector** — Caveat font + animated SVG arrow. One instance, one purpose, earned personality.
2. **CategoryBar visualization** — Proportional stacked bar + grid legend is information-dense and accurate.
3. **Filter + search bar** — Gated behind expenses.length > 0, conditional reset button, item count badge.

## Priority Issues

**[P1] Eyebrow reflex on every label — 12+ instances**
- What: `uppercase tracking-widest font-bold` on page subtitle, all 3 summary card labels, category legend labels, section header, per-expense category labels, delete button text, all 4 modal field labels.
- Why: Statistics and TripDetail cleaned up; Budget now visibly contradicts the system aesthetic.
- Fix: Change all to font-medium text-[11px] labels. Drop uppercase tracking-widest from every instance.
- Command: /impeccable polish budget

**[P1] formatCurrency hardcodes 'cs-CZ' locale everywhere**
- What: Line 19 — amount.toLocaleString('cs-CZ'). Line 463 hardcodes locale: cs for expense dates.
- Why: English-locale users see Czech number formatting for every amount.
- Fix: Thread i18n.language into formatCurrency. Fix line 463 date locale.
- Command: /impeccable harden budget

**[P1] AddExpenseModal has no focus trap, no ARIA dialog attributes**
- What: No role="dialog", no aria-modal="true", no aria-labelledby, no focus trap, close button unlabeled.
- Why: Tab escapes the modal; screen readers don't know a dialog is open.
- Fix: Add role/aria attrs, aria-label on close button, install focus trap.
- Command: /impeccable audit budget

**[P2] No reduced-motion guards on any animation**
- What: Sketch SVG animations (clipPath, pathLength lines 280-318), modal spring (lines 82-88), expense list motion.div (line 447) — all unguarded.
- Why: Vestibular-disorder users see significant animation with no opt-out.
- Fix: Add useReducedMotion() throughout Budget; guard sketch, modal, expense list.
- Command: /impeccable animate budget

**[P3] DollarSign unused import + date format inconsistency**
- What: DollarSign imported but unused. Summary cards: d. M. yyyy vs expense list: d. MMMM yyyy.
- Fix: Remove DollarSign. Standardize date format.
- Command: /impeccable polish budget

## Persona Red Flags

**Alex (Power User)**: No keyboard shortcut to add expense. No edit (delete + recreate). No bulk delete. No export.

**Riley (Stress Tester)**: Czech locale hardcoded — non-Czech users see wrong number format. Malformed trip dates would throw on lines 375/378. 50+ expenses render without virtualization.

**Casey (Distracted Mobile User)**: Horizontal summary card scroll has no affordance (no dots, no partial peek). Filter bar requires scroll before accessible on small phones.

## Minor Observations

- Summary card total uses border-blue-500/30 — subtle, nearly invisible against glass-card.
- Spring modal animation (damping 25, stiffness 200) slightly underdamped; replace with ease: [0.22, 1, 0.36, 1].
- Palmtree for "activities" may render differently across devices.
