-- ============================================================
-- Migration 001 – Advanced Expense Splitting / Shared Budgets
-- Adds `paid_by` to trip_expenses + new `expense_splits` table.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/001_expense_splitting.sql
-- ============================================================

-- 1) Who paid the expense (NULL = legacy/personal expense, not part of splits)
ALTER TABLE trip_expenses
    ADD COLUMN IF NOT EXISTS paid_by INT UNSIGNED DEFAULT NULL
        COMMENT 'Uživatel, který výdaj zaplatil (NULL = osobní výdaj bez rozdělení)'
        AFTER date;

ALTER TABLE trip_expenses
    ADD INDEX IF NOT EXISTS idx_expenses_paid_by (paid_by);

-- FK for paid_by → users(id). ON DELETE SET NULL so removing a user keeps the expense.
-- Note: MariaDB wants `ADD FOREIGN KEY IF NOT EXISTS <name> (col)` here —
-- `ADD CONSTRAINT IF NOT EXISTS ... FOREIGN KEY` is rejected on older versions.
ALTER TABLE trip_expenses
    ADD FOREIGN KEY IF NOT EXISTS fk_expenses_paid_by (paid_by)
        REFERENCES users(id) ON DELETE SET NULL;

-- 2) Junction table: how each expense is divided among trip members.
CREATE TABLE IF NOT EXISTS expense_splits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    expense_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Částka, kterou tento účastník dluží za daný výdaj',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_expense_user (expense_id, user_id),
    INDEX idx_splits_expense (expense_id),
    INDEX idx_splits_user (user_id),
    FOREIGN KEY (expense_id) REFERENCES trip_expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
