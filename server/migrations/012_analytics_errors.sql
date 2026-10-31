-- ============================================================
-- Migration 012 – Vlastní analytika a hlídání chyb
--
-- analytics_events: zobrazení stránek a akce uživatelů (registrace,
-- nový výlet, přidané místo…). Bez cookies: anonymní návštěvník je
-- denně se měnící hash (IP + prohlížeč + den + tajný klíč), IP se
-- neukládá. Přihlášený uživatel má user_id; po smazání účtu se
-- vynuluje (SET NULL), takže zůstane jen anonymní statistika.
-- env odděluje produkci od lokálního vývoje (ten běží proti stejné DB).
--
-- app_errors: chyby z prohlížeče i ze serveru, seskupené podle
-- otisku (fingerprint) — stejná chyba = jeden řádek s počítadlem.
--
-- Spusť PŘED nasazením kódu, který tabulky používá.
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/012_analytics_errors.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    env VARCHAR(16) NOT NULL DEFAULT 'production',
    name VARCHAR(48) NOT NULL COMMENT 'pageview, signup, trip_created, …',
    user_id INT UNSIGNED NULL,
    visitor_id CHAR(16) NOT NULL COMMENT 'Denně rotující hash, bez cookies',
    path VARCHAR(255) NULL COMMENT 'Normalizovaná cesta (/dashboard/trip/:id)',
    referrer_host VARCHAR(120) NULL,
    utm_source VARCHAR(80) NULL,
    utm_medium VARCHAR(80) NULL,
    utm_campaign VARCHAR(120) NULL,
    device ENUM('mobile', 'tablet', 'desktop') NULL,
    standalone TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Spuštěno jako PWA z plochy',
    country CHAR(2) NULL,
    props JSON NULL,

    INDEX idx_events_time (env, created_at),
    INDEX idx_events_name (env, name, created_at),
    INDEX idx_events_user (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_errors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fingerprint CHAR(40) NOT NULL,
    env VARCHAR(16) NOT NULL DEFAULT 'production',
    source ENUM('client', 'server') NOT NULL,
    message VARCHAR(500) NOT NULL,
    stack TEXT NULL,
    path VARCHAR(255) NULL,
    method VARCHAR(8) NULL,
    count INT UNSIGNED NOT NULL DEFAULT 1,
    users_affected INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Přibližně: zvýší se, když chybu dostane jiný uživatel než minule',
    last_user_id INT UNSIGNED NULL,
    user_agent VARCHAR(255) NULL,
    first_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,

    UNIQUE KEY uniq_error_fingerprint (fingerprint),
    INDEX idx_errors_last_seen (env, last_seen),
    FOREIGN KEY (last_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
