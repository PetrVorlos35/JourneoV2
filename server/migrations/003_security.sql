-- ============================================================
-- Migration 003 – Security: JWT revocation + shared rate limiting
-- Adds `token_version` to users + new `rate_limits` table.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/003_security.sql
-- ============================================================

-- 1) Verze tokenu: JWT nese claim `tv` a middleware ho porovnává s tímto
--    sloupcem. Zvýšení hodnoty (při změně/resetu hesla) zneplatní všechny
--    dříve vydané tokeny daného uživatele.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS token_version INT UNSIGNED NOT NULL DEFAULT 0
        COMMENT 'Bump zneplatní všechny dříve vydané JWT'
        AFTER is_verified;

-- 2) Sdílené počítadlo pro rate limiting auth endpointů. In-memory počítadla
--    express-rate-limit nejsou na serverless sdílená mezi instancemi; tahle
--    tabulka ano (stejný princip jako DB cooldown na OTP kódy).
CREATE TABLE IF NOT EXISTS rate_limits (
    rl_key VARCHAR(191) PRIMARY KEY,
    hits INT UNSIGNED NOT NULL DEFAULT 1,
    reset_at DATETIME NOT NULL,

    INDEX idx_rate_limits_reset (reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
