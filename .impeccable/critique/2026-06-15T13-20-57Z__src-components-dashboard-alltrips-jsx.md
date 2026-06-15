---
target: all-trips
total_score: 25
p0_count: 0
p1_count: 2
p2_count: 3
p3_count: 1
timestamp: 2026-06-15T13-20-57Z
slug: src-components-dashboard-alltrips-jsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active filter state visible; no trip count feedback |
| 2 | Match System / Real World | 3 | Labels natural; Activities:0 metadata reads developer-facing |
| 3 | User Control and Freedom | 3 | Delete confirmed; no undo; filters clearable |
| 4 | Consistency and Standards | 2 | Eyebrow style applied in 4 elements; shared indicator icon-only |
| 5 | Error Prevention | 3 | Delete confirm dialog present |
| 6 | Recognition Rather Than Recall | 2 | Shared-trip icon invisible to mobile; Activities count uninformative at 0 |
| 7 | Flexibility and Efficiency | 2 | No sort; full card not a link target |
| 8 | Aesthetic and Minimalist Design | 2 | Identical card grid (absolute ban); 4 eyebrow instances; always-visible red delete mobile |
| 9 | Error Recovery | 3 | Toast on delete; no undo path |
| 10 | Help and Documentation | 2 | No empty-state for 0 trips; no contextual cues |
| **Total** | | **25/40** | **Acceptable** |

## Anti-Patterns Verdict
Two absolute bans fire: (1) page subtitle eyebrow + 3 more instances of uppercase/tracked/bold on tiny text; (2) identical card grid—every card has same blue MapPin icon, same layout, same weight. Detector exit 0, zero findings—both issues are structural, not class-string patterns.

## Priority Issues

**[P1] Eyebrow pattern in 4 places**: subtitle, status badge, activities counter, Open link—all use uppercase tracking-widest font-bold on ≤12px text.

**[P1] Identical card grid**: Every card: same MapPin icon, same blue bg, same proportions. Zero visual identity between trips.

**[P2] Shared-trip indicator icon-only**: Users icon with title tooltip only. Mobile users can't discover it. No visible affordance for read-only status.

**[P2] Activities:0 negative signal**: New trips always show "Activities: 0". Replace with trip duration (N days).

**[P2] Native date input wrong affordance**: Filter by exact start date is rare; replace with sort control (Newest/Oldest/A–Z) or year filter.

## Persona Red Flags
- Alex: cards are div, not keyboard-navigable; no sort; no batch delete
- Casey: delete button always visible on mobile (opacity-100); Open link is 12px corner tap target; whole card should be tappable
- Tereza (occasional planner): identical blue pin cards feel like database rows, not a personal travel journal

## Minor Observations
- h3 in cards should be h2 (page already has h1)
- Date format asymmetry: start shows d.M. without year, end shows d.M.yyyy
- No staggered entrance animation on cards
- "Activities: N" only useful when >0
