---
target: friends page
total_score: 26
p0_count: 0
p1_count: 1
timestamp: 2026-06-15T18-48-44Z
slug: src-components-dashboard-friends-jsx
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Initial + search loading states good; accept/decline/remove have no per-button loading |
| 2 | Match System / Real World | 4 | Natural language throughout; accept/decline/remove are unambiguous |
| 3 | User Control and Freedom | 3 | Decline vanishes without undo; everything else reversible |
| 4 | Consistency and Standards | 2 | Search card uses different sizing/density; eyebrow treatment collides with rest of dashboard |
| 5 | Error Prevention | 3 | Confirmation before remove ✓; no guard on double-tap accept/decline ✗ |
| 6 | Recognition Rather Than Recall | 3 | Tab counts visible; status badges in search; remove hidden on desktop until hover |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts; no bulk actions; no quick-invite link |
| 8 | Aesthetic and Minimalist Design | 1 | 5 separate eyebrow violations create visual noise on every card and section |
| 9 | Error Recovery | 3 | Toast on failure; API error messages surfaced; no retry affordance |
| 10 | Help and Documentation | 2 | Empty states explain next step well; no first-run prompt when friends list is 0 |
| **Total** | | **26/40** | **Acceptable — improvements needed** |

### Anti-Patterns Verdict

**LLM assessment:** The page works functionally and has some nice touches — the `layoutId` tab indicator spring, debounced search, clear status badges. But it's undermined by an eyebrow reflex that has spread to five separate locations: the page subtitle, the search card header, the friend-card status badge, the remove button, and the "View Profile" link all use `uppercase tracking-widest`. Nearly every text-level element on the page carries this treatment, making it texture rather than intentional accent. This is the single biggest AI tell on this surface.

**Deterministic scan:** Returned 0 findings — eyebrow violations are confirmed by code reading only.

### Overall Impression

Solid UX skeleton that's been visually over-encoded. Strip the 5 eyebrow instances and add reduced-motion guards and this page is ship-ready. The interactions (search, accept, decline, confirmation on remove) are all well-considered. The biggest missed opportunity is that friend cards feel identical beyond personal data — a page about human connection should feel warmer.

### What's Working

1. **Tab indicator with `layoutId` spring** — Physics-based animated underline, smooth, communicates state without text.
2. **Debounced search with status-aware results** — 400ms debounce + per-user status badges handle all friendship states correctly and prevent redundant actions.
3. **Empty states with real next-step copy** — "Use the search above to find friends" closes the loop — user knows exactly what to do.

### Priority Issues

**[P1] Eyebrow anti-pattern — 5 instances**
- Lines: 129 (page subtitle), 135 (search card label), 267 (friend card status badge), 274 (remove button), 281 (view profile link)
- All use `uppercase tracking-widest` — absolute ban
- Fix:
  - Line 129: Regular `text-sm font-medium text-gray-500` subtitle
  - Line 135: Remove "ADD FRIENDS" label entirely — search input communicates this
  - Line 267: `bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-2.5 py-0.5 rounded-full text-[12px] font-medium`
  - Line 274: `text-[12px] font-medium text-red-500 hover:text-red-400` — no uppercase
  - Line 281: `text-[13px] font-semibold text-blue-600 dark:text-blue-400` — no uppercase
- Command: `/impeccable quieter`

**[P2] No `useReducedMotion` — stagger and tab animations unconditional**
- `staggerChildren: 0.1` on friends grid and requests list + tab spring — no reduced motion guard
- With 10 friends, last card animates at 1s delay
- Fix: Import `useReducedMotion`, gate staggerChildren: `shouldReduceMotion ? 0 : 0.1`
- Command: `/impeccable animate`

**[P2] Action buttons have no loading state**
- Accept / decline / remove have no loading indicator — slow API causes user to double-click
- Fix: Track in-flight IDs in a `Set`, disable buttons while pending
- Command: `/impeccable harden`

**[P2] Clear-search button has no `aria-label`**
- X button at line 149 announces "button" to screen readers
- Fix: `aria-label={t('friends.search.clear')}`
- Command: `/impeccable audit`

**[P2] Stagger too long for large friend lists**
- 15 friends = 1.5s cascade
- Fix: `staggerChildren: Math.min(0.1, 0.5 / Math.max(friends.length, 1))` or cap at 0.05
- Command: `/impeccable animate`

### Persona Red Flags

**Sam (Accessibility-Dependent)**:
- Search input has no associated label — hears "edit text" only ✗
- Clear search button announces "button" — no context ✗
- Stagger animations fire regardless of prefers-reduced-motion ✗
- Remove button on friend card has no contextual aria-label ("Remove [name]") ✗

**Alex (Power User)**:
- Clicks Accept on a request — no loading state, double-clicks ✗
- No keyboard shortcut to switch tabs ✗

**Jordan (First-Timer)**:
- Requests tab shows "0" count when empty — confusing whether this is an error or just empty ✗
- Add friend flow is actually excellent: button changes to "Request sent" with clock ✓

### Minor Observations

- Request count badge shows "0" when no requests — should hide when count is 0
- `AnimatePresence` at line 157 missing `mode` prop — enter/exit can overlap on rapid queries
- `// eslint-disable-next-line no-unused-vars` comment on AnimatePresence is wrong — it IS used at line 157
- Remove button hover-discovery pattern (hidden on desktop until hover) is consistent with AllTrips

### Questions to Consider

- "The friend card is glass-card, same surface as tool sections. Should people have a warmer, less architectural treatment?"
- "What does a friend currently on a trip look like vs. one who isn't? All cards are identical except name/avatar."
- "Should the Requests tab have a notification dot instead of a '0' count badge?"
