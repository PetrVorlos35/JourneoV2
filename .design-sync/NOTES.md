# JourneoV2 design-sync notes

JourneoV2 is a **private Vite app** (React 19, JSX, Tailwind v4), not a published
component library. The sync extracts its reusable presentational components.

## How this repo is wired into the converter

- **No library entry, no TypeScript.** `package.json` is `private` with no
  `main`/`module`/`exports`; `dist/` is a built *web app*, not importable
  components; everything is `.jsx`. So discovery can't come from `.d.ts`.
- **Barrel entry.** Every component is a `default` export, and the synth-entry
  fallback uses `export *` (which drops defaults). So `.design-sync/ds-entry.jsx`
  re-exports each component as a *named* export, and `cfg.entry` points at it.
  `cfg.componentSrcMap` enumerates the same set (discovery + src enrichment).
- **Provider.** `DSProvider` (exported from the barrel) wraps previews in
  `MemoryRouter` + an initialized i18n instance loaded with the real `en` locale
  (`src/locales/en/translation.json`), so cards render real labels and
  `react-router` `Link`s work. Set via `cfg.provider.component = "DSProvider"`.
- **Styling.** Tailwind v4 is compiled at app-build time. `cfg.cssEntry` points
  at the compiled `dist/assets/index-*.css` (149 KB). See Re-sync risks — the
  filename is content-hashed and changes on every `npm run build`.

## Scope: api-free components only

`src/services/api.js:1` reads `import.meta.env.VITE_API_URL` **at module load**.
The IIFE bundle defines `import.meta.url` but NOT `import.meta.env`, so any
component that imports `services/api` (directly or transitively) would throw at
bundle load and take down all of `window.Journeo`. Excluded for that reason:
- **LikeButton**, **NotificationBell** (`import api from '../../services/api'`).
- All page/feature screens (dashboard/*, admin/*, auth/*, public/*, LandingPage,
  PrivacyPolicy, TermsOfService) — they need router + auth + live trip data and
  can't render as standalone cards regardless.
If these are ever wanted, esbuild needs `import.meta.env` defined (would require
forking `lib/bundle.mjs`'s define — avoid) or a module-load-safe api shim.

## Capture harness gotchas (framer-motion)

The repo uses framer-motion heavily. `package-capture.mjs` runs under a
deterministic fixed clock (`page.clock.setFixedTime`) and its `settle()` only
waited for fonts/images, so framer spring entry animations (`y:"100%"`) were not
settled at screenshot time → blank cards.
- **Patched `settle()`** in the staged `.ds-sync/package-capture.mjs` to add
  `page.waitForTimeout(2400)`. This is a STAGED-SCRIPT edit — `cp -r` on re-sync
  overwrites it (see Re-sync risks).
- **Framer-animated components must be single-cell.** Under the fixed clock on a
  reused page, the FIRST animated cell renders but the SECOND+ stay blank
  (CSS-only components like SpotlightCard are fine with multiple cells). So
  overlays/animated previews use `cfg.overrides.<Name> = {cardMode:"single", ...}`
  and export exactly one cell. DialogModal: only the `Danger` confirm variant
  (the `prompt` variant also auto-focuses via a setTimeout the fixed clock never
  fires).

## Dark-first previews

`DSProvider` adds `.dark` to `document.documentElement` (via useEffect) — not just a
wrapper div — so components that `createPortal` to `document.body` (DialogModal) also
render dark. Without this, portaled overlays render in light mode. Previews are graded
dark-first to match the app's default theme.

## Card layout overrides (applied)

- Single-cell (full-page / fixed / animated overlay): DialogModal, NotFound, Navbar,
  HorizontalScrollCarousel (+ their viewport sizes).
- `cardMode: column` (wide rows): LocationAutocomplete, UserAvatar.

## Known render warns

- **First framer-animated cell of a capture batch sometimes screenshots blank**
  (DialogModal `Danger`, NotFound `Default`) — the spring entry hasn't settled on the
  very first cell even with the 2400ms settle. Fix: just recapture that component
  (`package-capture.mjs --components <Name> --force`); it renders on the retry. Verify
  these two after any capture run that re-screenshots them.
- LoadingScreen is a deliberate **floor card**: its wordmark (BlurText) is gated behind
  an IntersectionObserver + per-letter framer animation that doesn't settle under the
  headless fixed clock. Transient splash — left unauthored on purpose.

## Re-sync risks (watch-list)

- **`cfg.cssEntry` is a hashed path** (`dist/assets/index-CWVZTklN.css`). Every
  `npm run build` regenerates it with a new hash → `[CSS_IMPORT_MISSING]`/missing
  styles. On re-sync: rebuild the app, then update `cfg.cssEntry` to the current
  `dist/assets/index-*.css` (the large ~150KB one, not the small DashboardHome one).
- **The `settle()` patch is not durable.** Re-copying staged scripts on re-sync
  reverts `package-capture.mjs` to fonts/images-only settle. Re-apply the
  `page.waitForTimeout(2400)` patch (or framer-animated cards capture blank).
  Graded components carry forward regardless, so this only bites newly-authored or
  source-changed framer components.
- **Inlined data:** the i18n provider inlines `en` translations at build via the
  barrel `import`. If the locale file moves/renames, the barrel import breaks.
- **Excluded api-coupled components** (LikeButton, NotificationBell) stay excluded
  until the `import.meta.env` bundle issue is solved.
