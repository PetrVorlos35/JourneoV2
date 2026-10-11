-- ============================================================
-- Migration 007 – Notifikace o předání výletu
--
-- Při smazání účtu se vlastněné výlety s aspoň jedním editorem
-- předají nejdříve přidanému editorovi (DELETE /api/auth/account).
-- Nový vlastník dostane notifikaci TRIP_TRANSFERRED:
-- reference_id = id výletu, message = jméno původního vlastníka
-- (jeho účet už neexistuje, takže se nedá dojoinovat).
--
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/007_trip_transferred.sql
-- ============================================================

ALTER TABLE notifications
  MODIFY COLUMN type ENUM('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'TRIP_VOTED', 'TRIP_TRANSFERRED') NOT NULL;
