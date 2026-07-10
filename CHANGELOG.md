# Changelog

All notable changes to Journeo are documented here. This project follows
[Semantic Versioning](https://semver.org/).

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

[1.2.0]: https://github.com/
[1.1.0]: https://github.com/
[1.0.0]: https://github.com/
