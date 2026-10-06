-- ============================================================
-- Migration 006 – Ověření účtů založených přes Google
--
-- Google login dřív zakládal účty s is_verified = 0. Sjednocené
-- přihlášení (POST /auth/check-email) bere neověřený účet jako
-- nedokončenou registraci, takže by takový uživatel po zadání
-- e-mailu dostal formulář „Vytvořte si účet“.
--
-- Nové a znovu přihlášené Google účty už se ověřují v kódu; tahle
-- migrace dorovná ty stávající. Neověřený účet se bez Googlu
-- nemohl přihlásit, takže výlety nebo Google profilovka (URL)
-- znamenají, že účet patří Google uživateli.
--
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/006_verify_google_users.sql
-- ============================================================

UPDATE users u
SET u.is_verified = 1
WHERE u.is_verified = 0
  AND (
    u.avatar_url LIKE 'http%'
    OR EXISTS (SELECT 1 FROM trips t WHERE t.user_id = u.id)
  );
