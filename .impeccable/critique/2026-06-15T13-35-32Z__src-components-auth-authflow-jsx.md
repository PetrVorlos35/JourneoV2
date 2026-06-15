---
target: auth page
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-06-15T13-35-32Z
slug: src-components-auth-authflow-jsx
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good spinners and toasts; no loading state on page-level navigation |
| 2 | Match System / Real World | 4 | Natural language throughout, familiar auth conventions |
| 3 | User Control and Freedom | 3 | Back Home + Back to Login in all nested modes |
| 4 | Consistency and Standards | 2 | Reset mode uses `<label>` (no `htmlFor`); login/register use placeholders only |
| 5 | Error Prevention | 3 | Password strength gate, OTP length check, match validation before submit |
| 6 | Recognition Rather Than Recall | 3 | Placeholders, visible "Forgot password?", OTP shows email address |
| 7 | Flexibility and Efficiency | 2 | No autoFocus on mode switch; no keyboard shortcut to submit |
| 8 | Aesthetic and Minimalist Design | 2 | 4 eyebrow violations inject visual noise into an otherwise clean form |
| 9 | Error Recovery | 3 | Inline error block with motion; errors are global (not field-specific) |
| 10 | Help and Documentation | 2 | Password strength checklist is excellent; no help link, no OTP resend timer |
| **Total** | | **27/40** | **Acceptable — significant improvements needed** |

### Anti-Patterns Verdict

**LLM assessment:** The core layout — glass card, centered, max-w-md, blue glow blob — is a saturated AI template for auth flows. What saves it is the animated pill toggle (`layoutId="auth-tab"` with spring), the real password strength meter with inline checklist, and the Google spinner state — those are genuine differentiators. Without them this would score lower. The main tell is the eyebrow reflex: `text-[11px] font-bold uppercase tracking-widest` shows up 4 separate times across different UI elements.

**Deterministic scan:** The detector returned 0 findings. The eyebrow pattern isn't detectable by its current rules — it's identifiable by reading the code.

### Overall Impression

The auth flow is functionally solid — good states, real validation, clean animation. The single biggest opportunity is accessibility: form inputs have no programmatic labels whatsoever (login/register fields use only `placeholder`; reset mode labels have no `htmlFor`), which means screen readers can't navigate this form meaningfully.

### What's Working

1. **Pill tab toggle with `layoutId`** — The `motion.div layoutId="auth-tab"` spring animation is the best single interaction on this page. Smooth, physical, communicates state instantly.
2. **Password strength meter** — Inline bars + requirements checklist that appear only when the user is typing is exactly the right progressive disclosure.
3. **OTP flow design** — Showing the destination email address on the OTP confirmation screen removes the #1 source of OTP confusion.

### Priority Issues

**[P1] Eyebrow anti-pattern in 4 places**
- Lines: 199 (Back Home button), 389 (reset "Code" label), 407 (reset "New password" label), 641 ("OR" divider)
- All use `uppercase tracking-widest` — absolute ban pattern.
- Fix: Back Home → `font-semibold text-[13px]`, no uppercase. Reset labels → `text-[12px] font-medium text-gray-500 mb-1`, normal casing. OR divider → `text-[12px] font-medium text-gray-400`, no uppercase.
- Command: `/impeccable quieter`

**[P1] Form inputs have no programmatic labels**
- All login/register inputs use only `placeholder`. Reset `<label>` elements lack `htmlFor`; inputs lack matching `id`. WCAG 2.4.6 failure.
- Fix: Add `id` to each input, `htmlFor` to each label. Use `<label className="sr-only">` for login/register to keep visual design clean.
- Command: `/impeccable audit`

**[P2] No `useReducedMotion()` — animations always run**
- `AnimatePresence` form transitions and error animations run for users with `prefers-reduced-motion: reduce`.
- Budget.jsx correctly uses `useReducedMotion()` — this is an oversight.
- Fix: Import `useReducedMotion`, conditionally set `duration: 0` and `initial={false}`.
- Command: `/impeccable animate`

**[P2] Error messages not announced to screen readers**
- Error `motion.div` blocks have no `role="alert"` or `aria-live`. Screen reader users don't hear errors.
- Fix: Add `role="alert"` to each error block.
- Command: `/impeccable audit`

**[P2] No `autoFocus` on mode switch**
- Switching to otp/forgot/reset leaves focus on the previous control. Keyboard users must Tab to reach the first input.
- Fix: `autoFocus` on OTP input (line 294), forgot email input (line 349), reset OTP input (line 395).
- Command: `/impeccable harden`

### Persona Red Flags

**Sam (Accessibility-Dependent)** walking through login:
- Email field: hears "edit text" — no label. ✗
- Password field: hears "password field" — no label. ✗
- Submit → wrong-password error: no `role="alert"`, Sam hears nothing, must Tab back up to discover error. ✗
- Reset mode labels not linked to inputs — AT still announces "edit text". ✗

**Jordan (Confused First-Timer)** registering:
- Password strength meter appears inline — helpful ✓
- Mismatched confirm password: error appears at TOP of form section; Jordan's eyes are on the bottom (submit button). Easy to miss. ✗
- OTP mode: Check icon looks like "completed" rather than "check your email". Confusion. ✗

**Casey (Distracted Mobile)**:
- Register mode: ~700px of content on a small phone; Google button may be off-screen. ✗
- Gets interrupted mid-registration: all local React state is lost on return. ✗

### Minor Observations

- OTP confirmation icon (`<Check>`) conveys success, not "check your email" — `Mail` or `KeyRound` would be more accurate.
- Error messages animate IN but vanish instantly when cleared (no AnimatePresence exit).
- `disabled:cursor-not-allowed` on Back Home button is a dead class — button never receives `disabled` prop.
- `min-h-[160px]` on form container is a rough AnimatePresence workaround — leaves empty space in "forgot" mode.
- Password strength only checks 3 things — `Password123` scores "strong".

### Questions to Consider

- "What if the error message appeared near the submit button (at the bottom), where the user's attention is after filling in the form?"
- "The OTP screen lives inside the card — should it be a separate page? Users who close the tab lose their OTP context."
- "What if the Google button moved above the form as the primary path?"
