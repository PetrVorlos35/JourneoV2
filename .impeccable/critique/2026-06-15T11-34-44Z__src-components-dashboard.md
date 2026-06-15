---
target: dashboard
total_score: 28
p0_count: 0
p1_count: 0
p2_count: 2
p3_count: 2
timestamp: 2026-06-15T11-34-44Z
slug: src-components-dashboard
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Spring-animated nav pill, deletion toast, trip loading state — no global progress indicator on create flow |
| 2 | Match System / Real World | 3 | Plain-language copy, localized dates, familiar travel metaphors throughout |
| 3 | User Control and Freedom | 3 | Nav guards, delete confirmation, filter clear — mobile slide-over lacks Esc close |
| 4 | Consistency and Standards | 3 | 3-tier surface vocabulary applied cleanly; desktop sidebar has two entries for the same settings route |
| 5 | Error Prevention | 3 | Delete confirmation, unsaved-changes guard, date constraints in create modal |
| 6 | Recognition Rather Than Recall | 3 | N shortcut hinted on hover, explicit "Continue planning" CTA, tab counts — mobile nav icon-only for inactive items |
| 7 | Flexibility and Efficiency | 2 | N shortcut + countdown deep-link are real wins; no batch ops, recents, or tab keyboard navigation |
| 8 | Aesthetic and Minimalist Design | 3 | Main dashboard view is clean and purposeful; TripDetail still has uppercase tracked eyebrows; Quick Actions widget is compositionally thin |
| 9 | Error Recovery | 3 | Toast feedback, unsaved-changes guard before navigation, deletion undo absent but confirmation prevents the slip |
| 10 | Help and Documentation | 2 | N shortcut hint (hover-only) is the only in-UI affordance; no contextual tooltips, no help access |
| **Total** | | **28/40** | **Good — address weak areas, solid foundation** |

## Anti-Patterns Verdict

**Does this look AI-generated?** No longer. The hero-metric SaaS template, uniform glass-card surface vocabulary, and eyebrow-on-every-section reflex are gone from the main dashboard view. The countdown card is the strongest design moment: contextual countdown, deep-link navigation, explicit CTA, and N keyboard shortcut — all in one purposeful card. The 3-tier surface system creates real hierarchy without noise.

The remaining AI grammar lives in TripDetail.jsx: sidebar section labels in `uppercase tracking-widest`, date display with `tracking-widest uppercase`, mobile tool cards with `uppercase tracking-widest` counts. That component is still in 2023-template territory while the dashboard overview has moved on.

**Deterministic scan**: 12 findings, all `gray-on-color` warnings — all false positives.
- DashboardLayout.jsx line 178: detector matched `text-gray-900` + `bg-blue-500` from `selection:bg-blue-500/30` (pseudo-class, not layout background).
- TripDetail.jsx lines 271, 356, 362, 368, 441, 451: mutually exclusive conditional class states (when bg-blue-50 is active, text is text-blue-600, not gray).

Zero real violations. No banned patterns remain in the codebase.

## Overall Impression

The main dashboard view reads like a product made by someone who knows what they want. Surface hierarchy is clear, the countdown card is genuinely useful, motion is purposeful. Score improvement (23 → 28) reflects real craft work. TripDetail is still carrying the old aesthetic, and the sidebar has a navigation redundancy that will confuse first-timers.

## What's Working

1. **The countdown card is a standout.** Contextual trip data, explicit "Continue planning" CTA, N keyboard shortcut hinted on hover, accessible overlay link with focus-visible:ring-inset. Every user type gets a different entry point to the same action.
2. **The 3-tier surface vocabulary holds.** Shell (sidebar, barely-there), Utility (stats widget, border-only), Content (countdown + trip cards, full glass-card). The hierarchy reads at a glance.
3. **Motion is purposeful and inclusive.** useReducedMotion() guards on all six animation sites, spring-animated nav pill, staggered card entrance. Orbs static for reduced-motion users.

## Priority Issues

**[P2] TripDetail retains the old aesthetic language**
- What: TripDetail.jsx has `uppercase tracking-widest` text at lines 279, 353, 375, 389, 413, 419, 423, 445, 455 — sidebar section labels, date display, info-section field labels, mobile tool card counts.
- Why it matters: Users see a post-critique dashboard overview then a 2023-template trip detail. Perceptual whiplash breaks the brand voice.
- Fix: Remove `uppercase tracking-widest` from all TripDetail sidebar headers and info labels. Drop case transformation from date display at line 279.
- Suggested command: /impeccable audit TripDetail

**[P2] Duplicate settings entry in desktop sidebar**
- What: Two navigation targets for /dashboard/settings — SidebarItem at lines 257–263 and profile card Link at lines 264–272.
- Why it matters: Two affordances, one destination. Creates "which one?" ambiguity and wastes a sidebar slot.
- Fix: Remove the standalone SidebarItem for Settings. Keep only the profile card link.
- Suggested command: /impeccable polish

**[P3] Quick Actions widget is compositionally thin**
- What: The lg:col-span-3 grid slot holds a single Budget button. Designed for two actions, now only has one.
- Why it matters: Asymmetric layout at desktop. Full column for one button signals something is missing.
- Fix: Add a second contextual quick action, or collapse stats + quick actions into a single widget.
- Suggested command: /impeccable layout

**[P3] Mobile bottom nav uses icon-only labels for inactive items**
- What: Floating nav pill shows icons for all five routes, label only for active route. Active label also uses `uppercase tracking-widest`.
- Why it matters: First-time users can't identify Map vs BarChart2 vs Wallet without prior knowledge.
- Fix: Show short label for all nav items at all times. Drop uppercase tracking-widest from active label.
- Suggested command: /impeccable polish

## Persona Red Flags

**Alex (Power User)**: N shortcut is a real win. BUT tab-switching between trip categories is mouse-only, no way to keyboard-navigate between cards without Tab through everything. Settings item + profile card redundancy reads as a bug.

**Sam (Accessibility-Dependent)**: Mobile slide-over lacks Esc close, role="dialog", aria-modal="true", and focus trap. Background content is reachable by Tab behind the modal backdrop. Delete buttons use title (not aria-label) — not read by VoiceOver. Likes counter is icon-only for non-owner trips.

**Casey (Distracted Mobile User)**: FAB and bottom nav well-positioned. BUT activeCategory state resets on re-mount — returning to the app mid-flow loses the active tab filter.

## Minor Observations

- Mobile hamburger icon (Menu) is semantically mismatched: it opens Settings/Logout, not full nav. MoreHorizontal or User icon would match the actual content better.
- Date filter input renders as native browser date picker — inconsistent styling on Safari vs Chrome vs mobile.
- Two text-gray-* classes on mobile slide-over section headers (gray-500 then gray-400 in same className string).
