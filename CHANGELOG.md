# Changelog

All notable changes to Journeo are documented here. This project follows
[Semantic Versioning](https://semver.org/).

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

[1.1.0]: https://github.com/
[1.0.0]: https://github.com/
