-- ============================================================
-- Migration 008 – Verze výletu (ochrana proti přepsání)
--
-- PUT /api/trips/:id přepisuje celé seznamy (program, výdaje,
-- balení, dokumenty). Klient posílá verzi, ze které vycházel;
-- když se mezitím výlet změnil, server vrátí 409 místo toho,
-- aby tiše přepsal cizí úpravy. Každé uložení verzi zvýší o 1.
--
-- Spusť PŘED nasazením kódu, který sloupec čte.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/008_trip_version.sql
-- ============================================================

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS version INT UNSIGNED NOT NULL DEFAULT 0
  COMMENT 'Zvyšuje se při každém PUT /api/trips/:id' AFTER budget_target;
