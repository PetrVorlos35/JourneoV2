-- ============================================================
-- Migration 004 – Trash: soft-delete for trips
-- Adds `deleted_at` to trips. A non-NULL value means the trip is
-- in the trash; related rows (activities, expenses, …) stay intact
-- until the trip is purged (hard delete cascades them away).
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/004_trash.sql
-- ============================================================

ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL DEFAULT NULL
        COMMENT 'Non-NULL = výlet je v koši; po 30 dnech se maže natvrdo'
        AFTER budget_target;

-- Purge job i výpis koše filtrují podle deleted_at.
ALTER TABLE trips
    ADD INDEX IF NOT EXISTS idx_trips_deleted (deleted_at);
