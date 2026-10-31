-- ============================================================
-- Migration 011 – Volitelné e-mailové upozornění
--
-- Uživatel si v Nastavení vypne e-maily, které nechce. Ověřovací
-- a resetovací kódy chodí vždycky a přepínač nemají. Výchozí 1 =
-- všem stávajícím uživatelům se nic nemění. Uživatel bez řádku
-- v user_settings se bere jako „všechno zapnuto“.
--
-- Spusť PŘED nasazením kódu, který sloupce čte.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/011_email_prefs.sql
-- ============================================================

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS email_friend_requests TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'E-mail při nové žádosti o přátelství',
  ADD COLUMN IF NOT EXISTS email_settlements TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'E-mail, když mi někdo vyrovná dluh',
  ADD COLUMN IF NOT EXISTS email_trip_transfers TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'E-mail, když mi někdo předá výlet (smazal účet)';
