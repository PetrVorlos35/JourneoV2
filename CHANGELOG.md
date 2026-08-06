# Changelog

All notable changes to Journeo are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [1.4.0] – 2026-08-06

### Added — Spotlight search (⌘K)

A command palette over the whole dashboard that searches *content*, not just
navigation. It indexes trips, itinerary days, expenses, packing items, notes,
saved places and friends alongside pages and actions, and every result is a
deep link into the exact spot it describes.

- **⌘K / Ctrl+K from anywhere**, including from inside a text field, plus a
  visible trigger in the sidebar and a search icon in the mobile top bar.
- **Diacritics-insensitive fuzzy matching** (`src/utils/fuzzy.js`) — "londyn"
  matches "Londýn"; per-token scoring across title, subtitle and keywords, so
  "praha 890" finds an expense by trip and amount. Matched characters are
  highlighted in the result title.
- **Deep links** — places focus and open on the map (`?place=<id>`), itinerary
  days open on that day (`?day=<n>`, 1-based), expenses / packing / notes open
  the matching trip tool (`?view=`).
- **Actions** — create a trip, switch appearance, switch language, log out.
- **Recents** — the last five opened items, kept in `localStorage`, shown
  before anything is typed alongside active trips and quick starts.
- **Keyboard** — arrows/Tab to move, Enter to open, Escape to close; grouped
  results ordered by best match, with the active row scrolled into view.
- Loaded as its own lazy chunk, so it costs nothing until first use. Places and
  friends are fetched once, on first open.

### Added — Dashboard overview

The overview was rebuilt around one question — "what now?" — instead of a
generic list of trips.

- **Hero card** (`overview/HeroCard`) adapts to the user's actual situation:
  the trip under way (today's day and plan, jump-in actions), a countdown for
  an upcoming trip, the last trip as a memory, or a first-run invitation.
- **Readiness card** (`overview/ReadinessCard`) — a weighted score (itinerary
  40, packing 30, places 15, documents 15) shown as a ring, with all four
  pillars listed and each linking to the tool that completes it, so the
  percentage is never a number taken on faith.
- **Metric tiles** (`overview/OverviewTiles`) — budget, cross-trip settle-up,
  countries visited and trip count. A four-column grid on desktop, a full-bleed
  horizontal snap rail on mobile.
- **Side data** (`overview/useOverviewData`) loads places, the settle-up rollup
  and pending friend requests independently; each failure degrades one tile to
  "—" rather than taking the overview down.

### Changed

- The overview no longer carries its own search box and status tabs. Filtering
  and sorting trips lives in **My trips**; finding anything specific is now
  ⌘K's job.
- `TripDetail` accepts `?day=<n>`; an explicit deep link now wins over the
  default "jump to today" behaviour. `MapPage` accepts `?place=<id>` and
  consumes the parameter after focusing.
- Helpers that had been copy-pasted across pages were extracted and shared:
  `utils/trip`, `utils/tripColor`, `utils/country`, `utils/currency`, and the
  `AnimatedValue` / `MetricCard` components (previously duplicated in
  Statistics and AllTrips).

### API

- Added `GET /api/trips/balances-summary` — a settle-up rollup across every
  trip the user takes part in, including recorded settlements. It can't be
  derived from `GET /api/trips`, which doesn't carry them.

## [1.3.0] – 2026-07-24

### Added — Places Map

Journeo now has a map. Users can save places — visited or on their wishlist —
on a personal global map spanning every trip, and on a per-trip map where places
are pinned to itinerary days and connected by a route. The experience is a single
immersive canvas, unified across desktop and mobile.

- **Global map** (`/dashboard/map`) — every saved place across all trips on one
  canvas, filterable by status (visited / wishlist), category, and trip.
- **Trip map** — places bound to itinerary days, with a dashed route drawn
  between them in day order and a total-distance summary.
- **Add a place** — via a crosshair ("place here") flow so the pin never hides
  under a finger or cursor, or by searching an address (Nominatim geocoding).
- **Reverse geocoding** — clicking/placing a point fills in the address, city,
  and country when available; the place still saves with bare coordinates if not.
- **Import from itinerary** — pull the locations written into a trip's daily
  plans onto the map in one action (server-side geocoding, batched).
- **Unified immersive UI** — a full-bleed map with floating controls and an
  information panel: a draggable bottom sheet on mobile, a collapsible floating
  side panel on desktop (shared `MapWorkspaceView`).
- **Light and dark map themes** — CARTO raster tiles matched to the app theme.

### Changed

- The global map and trip map desktop layouts were unified with the mobile
  immersive view; the previous side-column-in-flow desktop layout was removed.

### Database

- Added the `places` table (migration `server/migrations/005_places.sql`).

## [1.2.0] – 2026-07-10

### Added — PDF Trip Export

Every trip can now be exported as a polished, print-ready PDF document that
mirrors everything the user sees on the trip screen — designed to feel
unmistakably like Journeo (Inter typography, the signature blue accent,
soft rounded cards, and a handwritten "Bon voyage!" sign-off).

- **Export PDF button** — in the trip header on both desktop and mobile,
  available to owners, editors, and viewers alike.
- **Section picker** — clicking Export PDF opens a selection sheet so the user
  can choose exactly which sections (itinerary, packing list, links & notes,
  budget) go into the document, instead of always getting everything.
- **Complete trip snapshot** — the document includes the trip title and dates,
  quick-stat chips (days, stops, budget), the full day-by-day itinerary with
  locations and plans, the packing list with its checked-off state, and all
  saved links & notes.
- **Budget section** — total spent vs. planned target with a progress bar,
  a per-category breakdown, and a full expense table including the date,
  category, and who paid for each expense.
- **Balances for shared trips** — each member's net balance and the suggested
  settlements are folded into the budget section when the trip has shared
  expenses (fetched from `GET /api/trips/:id/balances`).
- **Fully localized** — the PDF renders in the user's language (cs / en),
  including dates and number formatting.
- **Zero new dependencies** — implemented as a print-optimized stylesheet
  (`TripPdfExport.jsx` plus a dedicated `@media print` layer) rendered through
  the browser's native PDF engine, so the output is crisp vector text, not a
  screenshot.

### Changed

- The trip detail header gained a dedicated export action next to Share.

## [1.1.0] – 2026-06-29

### Added — Advanced Expense Splitting / Shared Budgets

The Trip Budget feature has been expanded into a full expense-splitting system
(in the spirit of Splitwise / Spend Together), so collaborators on a shared trip
can track who paid for what and settle up fairly.

- **Who paid** — each expense now records which trip member paid for it
  (`paid_by` on `trip_expenses`).
- **Split among collaborators** — costs can be divided equally or with custom
  amounts across selected trip members, stored in a new `expense_splits`
  junction table.
- **Personal expenses** — an expense can be marked personal (not split) so it
  stays out of the shared ledger while still counting toward the budget.
- **Balances overview** — the Budget tab shows a glassmorphism "Balances" card
  with each member's net balance (gets back / owes / settled up) and their real
  chosen avatar.
- **Simplified settlements** — a backend debt-simplification engine
  (`server/lib/balances.js`) computes the minimal set of "who pays whom"
  transactions, surfaced via a new `GET /api/trips/:id/balances` endpoint.

### Added — Settle Up (Vyrovnání dluhů)

Debts can now be settled directly in the app, with bank details and an email
notification to close the loop.

- **Settle Up** — a button next to each debt you owe opens a glassmorphism modal
  showing "You owe [amount] to [name]" and the recipient's bank account, with a
  "Mark as paid" action.
- **Bank account / IBAN** — a profile field (Settings) so trip mates can pay you
  back; shown in the Settle Up modal with one-tap copy.
- **Compensating transactions** — settlements are recorded in a dedicated
  `trip_settlements` ledger and folded into the balance engine, zeroing the debt
  without inflating the budget total.
- **Email notification** — the person who was owed money gets a localized
  (cs / en) email when their debt is settled, sent non-blocking via Nodemailer.
- **All-settled confirmation** — once everyone is square, the Balances card shows
  a persistent "Everyone's settled up 🎉" banner.
- New endpoint: `POST /api/trips/:id/settle`.

### Changed

- `PUT /api/trips/:id` and `GET /api/trips` now persist and return each expense's
  `paidBy` and `splits`.
- `GET /api/trips/:id/balances` now folds in recorded settlements and includes
  each member's `bankAccount`.
- Currency conversion now scales split amounts alongside expense totals so they
  stay consistent.
- The Add Expense modal was redesigned to be more compact, with a clearer
  split/personal toggle and inline payer selection.

### Database

- Added `paid_by` to `trip_expenses` (FK → `users`, `ON DELETE SET NULL`).
- Added the `expense_splits` table (FK → `trip_expenses` `ON DELETE CASCADE`).
- Added `bank_account` to `users`.
- Added the `trip_settlements` table (FK → `trips` / `users`, `ON DELETE CASCADE`).
- Migrations: `server/migrations/001_expense_splitting.sql` and
  `002_settle_up.sql` (both idempotent).

## [1.0.0] – 2026-06-19

### Added — First public release

- Trip planning with a day-by-day itinerary.
- Budget with a target amount and expense tracking.
- Friends and trip sharing via a personal link with roles.
- Travel statistics gathered in one place.
- Light and dark mode, available in English and Czech.

[1.3.0]: https://github.com/
[1.2.0]: https://github.com/
[1.1.0]: https://github.com/
[1.0.0]: https://github.com/
