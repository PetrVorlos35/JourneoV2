---
target: admin
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-06-18T20-45-42Z
slug: src-components-admin
---
# Critique — Admin panel (re-run, post-redesign)

## Design Health Score

| # | Heuristic | Score | Δ | Key Issue |
|---|-----------|-------|---|-----------|
| 1 | Visibility of System Status | 3 | = | Spinners/toasts/empty states; aria-current now added. |
| 2 | Match System / Real World | 3 | = | Clear admin terms, orange=admin. |
| 3 | User Control and Freedom | 4 | ↑ | Slide-overs now Esc-close + focus restore + confirm dialogs. |
| 4 | Consistency and Standards | 4 | ↑ | Palette unified to a single orange accent; dashboard no longer diverges. |
| 5 | Error Prevention | 4 | = | Confirm dialogs + self-protection. |
| 6 | Recognition Rather Than Recall | 3 | = | Desktop row actions still hidden until hover; search unlabeled. |
| 7 | Flexibility and Efficiency | 3 | = | Search + pagination + row-click; no bulk actions / shortcuts. |
| 8 | Aesthetic and Minimalist Design | 3 | ↑ | Gradient text, rainbow palette, hero-metric grid all gone. Glassmorphism + eyebrow labels remain. |
| 9 | Error Recovery | 3 | = | Toasts carry failure messages. |
| 10 | Help and Documentation | 2 | = | Icon tooltips only; search still unlabeled. |
| **Total** | | **32/40** | **↑ from 29** | **Good. AI-dashboard skin removed; refinement remains.** |

## Anti-Patterns Verdict

Deterministic scan: 17 warnings, all `gray-on-color` — verified false positives (ternary/hover classes in one className string). gradient-text 3→0, ai-color-palette 3→0 since last run.

LLM assessment: **Pass now.** The dashboard no longer reads as a stock AI SaaS template — the hero-metric card grid is gone, the rainbow of gradient icons is gone, the gradient-clipped headings are gone, and the panel commits to one orange accent. Remaining subtle tells: `backdrop-blur` as the default card surface, and `text-[11px] uppercase tracking-widest` eyebrow labels on every section/table header.

## Overall Impression

Big step up. The two products are now one: the (always-good) tables and the (now-serious) dashboard share a palette and a register. The panel reads as a calm admin tool rather than a colorful consumer surface — which is exactly right for a "danger zone." What's left is refinement, not rework: trim the decorative glass/eyebrows, and close the last accessibility/efficiency gaps the audit surfaced.

## Priority Issues

- **[P2] Glassmorphism is still the default surface.** Every card is `backdrop-blur-xl` over two animated glow blobs. With the palette now calm, the blur is the last decorative layer that doesn't earn its place in a data tool. Consider flat opaque surfaces (or reuse the app's `.glass-card` token deliberately, not per-card raw blur).
- **[P2] Eyebrow labels everywhere.** `uppercase tracking-widest` micro-labels head every card, table, and detail section. Table column headers are a fair convention; the section-header eyebrows are the kicker tell. Pick one cadence.
- **[P2] Discoverability gaps (from audit).** Search inputs have only a placeholder (no accessible name); desktop row actions are `opacity-0` until hover so keyboard focus is invisible. Both hurt recognition and a11y.
- **[P3] Power-admin efficiency.** No bulk-select/delete and no keyboard shortcuts — fine for low volume, limiting as data grows.
- **[P3] Detail panels still shout.** Slide-over headings/numbers remain `font-black` while the rest of the panel moved to `font-bold`; mild inconsistency. Route-vs-slideover (no deep-link/back) is still open.

## Persona Red Flags

**Alex (Admin power user):** Now reads as a proper tool, not a toy. Still no bulk actions or shortcuts; row actions invisible until hover remains his main friction.

**Sam (Accessibility):** Major win — slide-overs are now operable (Esc, focus trap, role=dialog, focus restore), nav has aria-current, focus rings exist. Remaining: unlabeled search field, invisible focus on hover-hidden row actions, dark-mode placeholder/empty-state contrast under 4.5:1.

## Minor Observations

- Hard-coded hex surfaces (`#0a0a0b`, `#111113`, `#0e0e10`) repeated across files — no token layer.
- Touch targets (32px mobile actions, pagination) under 44px — flagged in audit.
- z-index still arbitrary (`z-[100]`, `z-[99999]`).

## Questions to Consider

- Does an admin data tool need any blur at all, or would flat opaque surfaces read as more trustworthy?
- As trip/user counts grow, what's the first thing an admin will wish they could do in bulk?
