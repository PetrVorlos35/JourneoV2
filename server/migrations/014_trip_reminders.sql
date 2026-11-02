-- ============================================================
-- Migration 014 – Připomínka 3 dny před odjezdem
--
-- Denní cron (/api/cron/trip-reminders) pošle vlastníkovi i parťákům
-- výletu e-mail, co ještě zbývá připravit (balení, program, dokumenty).
-- trip_reminders hlídá, aby stejná připomínka nedorazila dvakrát
-- (opakovaný běh cronu, posunutý a vrácený termín). Uživatel si ji
-- vypne v Nastavení (user_settings.email_trip_reminders).
--
-- Spusť PŘED nasazením kódu, který tabulku a sloupec používá.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/014_trip_reminders.sql
-- ============================================================

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS email_trip_reminders TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'E-mail 3 dny před odjezdem';

CREATE TABLE IF NOT EXISTS trip_reminders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    kind VARCHAR(16) NOT NULL COMMENT 'before_3d',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_trip_reminder (trip_id, user_id, kind),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
