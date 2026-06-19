---
target: friend invite link
total_score: 23
p0_count: 0
p1_count: 1
timestamp: 2026-06-18T20-10-37Z
slug: src-components-dashboard-friends-jsx-invite
---
# Critique — Friend invite link (compact row)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Copy → green check + toast; regenerate → spinner. Solid. |
| 2 | Match System / Real World | 2 | No label naming it an "invite link"; raw `add-friend` path is technical. |
| 3 | User Control and Freedom | 3 | Regenerate has confirm dialog; copy is harmless/reversible. |
| 4 | Consistency and Standards | 2 | Borderless row floats among glass-card sections; copy-as-text vs icon-button elsewhere. |
| 5 | Error Prevention | 3 | Regenerate confirm dialog present; mitigates accidental icon click. |
| 6 | Recognition Rather Than Recall | 1 | No section label; icon-only regenerate (tooltip only). User must infer what the row is. |
| 7 | Flexibility and Efficiency | 3 | select-all + one-click copy is efficient. |
| 8 | Aesthetic and Minimalist Design | 3 | Genuinely minimal — but orphaned for lack of any container. |
| 9 | Error Recovery | 2 | Regenerate error toasted; copy has no try/catch (silent fail on clipboard reject). |
| 10 | Help and Documentation | 1 | Explanatory sentence was removed; no inline help left. |
| **Total** | | **23/40** | **Acceptable — clarity regressions drag down a clean visual.** |

## Anti-Patterns Verdict

Deterministic scan: detect.mjs on Friends.jsx returned `[]` — zero slop tells. No gradient text, no side-stripe, no eyebrow scaffolding, no decorative glass.

LLM assessment: Not AI-sloppy. The opposite problem — the compact rewrite stripped so much that it reads as an unstyled fragment rather than a designed element.

## Overall Impression

The size complaint is fixed; we overcorrected. The link is now a context-free row sitting between the h1 and the first glass-card. It no longer shouts, but it also no longer explains itself or reads as part of the page's visual system. Biggest opportunity: a middle ground — compact AND self-explanatory AND visually anchored.

## Priority Issues

- **[P1] No label / lost context.** Title + description were both deleted. A first-timer sees a truncated URL, a Copy button, and a mystery ↻ with no idea this is a shareable invite. Fix: one short inline label or helper line ("Zvací odkaz — pošlete ho komukoliv"). Recognition-over-recall + Help both fail here.
- **[P2] Orphaned container.** Every other block on this page is a `glass-card rounded-[2rem]`. The invite is now borderless and floats. Fix: wrap in a lighter contained treatment (subtle bordered strip or a slim card) so it belongs without dominating.
- **[P2] Touch targets under 44px.** Copy is a short text button (~20px tall); regenerate is 36×36. Both below the 44×44 minimum for thumb use (Casey). Fix: pad the copy hit-area; bump regenerate to ≥44.
- **[P2] Icon-only regenerate.** Tooltip-only label invisible on touch; the action invalidates the existing link. Mystery destructive-ish control. Fix: keep it compact but give a visible affordance, or pair with an accessible menu.
- **[P2] Copy has no error handling.** `await navigator.clipboard.writeText` with no try/catch — on clipboard reject (insecure context) it fails silently, no toast either way. Fix: wrap, toast on failure.

## Persona Red Flags

**Jordan (First-Timer):** Lands on Friends, sees a URL row with no heading. Doesn't know it's an invite to share, or who can use it. Likely ignores it entirely — the feature's discoverability is gone.

**Casey (Mobile):** Copy text-target is too short to tap reliably; regenerate icon is 36px and unlabeled. One-handed use is fiddly and the ↻ is a guess.

## Minor Observations

- Double confirmation on copy: inline green state AND a toast. Pick one (inline is enough for an in-place action).
- Truncated URL + select-all is fine for a copy-driven flow, but combined with no label it's fully opaque.

## Questions to Consider

- What's the minimum a first-timer needs to understand this in 3 seconds — and can a 4-word label carry it without bringing back the big card?
- Should the invite even live above the fold, or is it secondary to seeing your friends?
