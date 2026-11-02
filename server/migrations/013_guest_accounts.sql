-- ============================================================
-- Migration 013 – Zkušební režim bez registrace (hosté)
--
-- Host je skutečný účet s příznakem is_guest: bez e-mailu (dostane
-- nedoručitelnou adresu …@guest.journeo.invalid), s ukázkovým výletem
-- a jedním vlastním. guest_expires_at = konec 3denní zkoušky; potom je
-- účet den jen pro čtení (prohlížení, PDF) a pak ho noční cron smaže
-- (výlety a místa padnou kaskádou). Registrací nebo přihlášením se
-- výlety hosta převedou na skutečný účet a host zmizí.
--
-- trips.is_sample označí ukázkový výlet, aby se nepočítal do limitu
-- vlastních výletů (teď host 1, později freemium).
--
-- Spusť PŘED nasazením kódu, který sloupce čte.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/013_guest_accounts.sql
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_guest TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Zkušební účet bez registrace' AFTER role,
  ADD COLUMN IF NOT EXISTS guest_expires_at DATETIME NULL
    COMMENT 'Konec zkoušky; den poté se účet smaže' AFTER is_guest;

ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_users_guest (is_guest, guest_expires_at);

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS is_sample TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Ukázkový výlet ze zkušebního režimu' AFTER currency;
