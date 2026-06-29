-- ============================================================
-- Migration 002 – Settle Up (Vyrovnání dluhů)
-- Adds `bank_account` to users + new `trip_settlements` table.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/002_settle_up.sql
-- ============================================================

-- 1) Bank account / IBAN on the user profile, used when settling debts.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bank_account VARCHAR(64) DEFAULT NULL
        COMMENT 'Číslo účtu / IBAN pro vyrovnání dluhů'
        AFTER bio;

-- 2) Settlement ledger: each row is a compensating payment from_user -> to_user.
CREATE TABLE IF NOT EXISTS trip_settlements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id INT UNSIGNED NOT NULL,
    from_user_id INT UNSIGNED NOT NULL COMMENT 'Plátce (dlužník)',
    to_user_id INT UNSIGNED NOT NULL COMMENT 'Příjemce (věřitel)',
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_settlements_trip (trip_id),
    INDEX idx_settlements_from (from_user_id),
    INDEX idx_settlements_to (to_user_id),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
