-- ============================================================
-- Migration 010 – Měna výletu a výdaje v cizí měně
--
-- Dřív byla měna jen nastavením uživatele a částky u výletu
-- byly čísla bez měny, takže dva lidé ve sdíleném výletu viděli
-- stejné částky s jiným symbolem. Teď má měnu výlet (trips.currency)
-- a všechny částky výletu (výdaje, dělení, vyrovnání, limit) jsou
-- v ní. Stávající výlety dostanou měnu vlastníka z nastavení,
-- takže se mu nic nezmění.
--
-- Výdaj zadaný v jiné měně si pamatuje původní částku, měnu a
-- kurz, kterým se převedl (ECB ke dni výdaje, nebo ručně zadaný).
-- Kurz se uloží jednou a dál se nemění. NULL = zadáno v měně výletu.
--
-- Spusť PŘED nasazením kódu, který sloupce čte.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/010_trip_currency.sql
-- ============================================================

-- Nejdřív NULL, ať se dá doplnit měna vlastníka jen tam, kde ještě chybí
-- (opakované spuštění tak nepřepíše měnu, kterou si někdo mezitím změnil).
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NULL
  COMMENT 'Měna výletu, v ní jsou všechny částky výletu' AFTER budget_target;

UPDATE trips t
  LEFT JOIN user_settings s ON s.user_id = t.user_id
  SET t.currency = COALESCE(s.currency, 'CZK')
  WHERE t.currency IS NULL;

ALTER TABLE trips
  MODIFY COLUMN currency CHAR(3) NOT NULL DEFAULT 'CZK'
  COMMENT 'Měna výletu, v ní jsou všechny částky výletu';

ALTER TABLE trip_expenses
  ADD COLUMN IF NOT EXISTS original_amount DECIMAL(14, 2) NULL
    COMMENT 'Částka v měně, ve které se platilo (NULL = v měně výletu)' AFTER amount,
  ADD COLUMN IF NOT EXISTS original_currency CHAR(3) NULL AFTER original_amount,
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(20, 10) NULL
    COMMENT '1 jednotka original_currency = exchange_rate jednotek měny výletu' AFTER original_currency,
  ADD COLUMN IF NOT EXISTS rate_date DATE NULL COMMENT 'Den kurzu ECB' AFTER exchange_rate,
  ADD COLUMN IF NOT EXISTS rate_source ENUM('ecb', 'manual') NULL AFTER rate_date;
