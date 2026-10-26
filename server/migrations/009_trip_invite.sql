-- ============================================================
-- Migration 009 – Pozvánka do výletu odkazem
--
-- Vedle veřejného odkazu jen pro čtení (share_token) má výlet
-- i zvací odkaz (invite_token): kdo ho otevře a přihlásí se,
-- stane se editorem výletu. Vlastník dostane notifikaci
-- TRIP_JOINED. Tak se parta dostane do výletu bez toho, aby
-- se nejdřív musela přidat mezi přátele.
--
-- Spusť PŘED nasazením kódu, který sloupec čte.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/009_trip_invite.sql
-- ============================================================

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS invite_token CHAR(64) NULL
  COMMENT 'Zvací odkaz /join/:token, kdo ho přijme, je editor' AFTER share_token,
  ADD UNIQUE INDEX IF NOT EXISTS idx_trips_invite_token (invite_token);

ALTER TABLE notifications
  MODIFY COLUMN type ENUM('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'TRIP_VOTED', 'TRIP_TRANSFERRED', 'TRIP_JOINED') NOT NULL;
