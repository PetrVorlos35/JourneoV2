-- ============================================================
-- Migration 005 – Mapa výletů: uložená místa + cache geokódování
--
-- `trip_places` drží body na mapě. Místo může patřit k výletu
-- (a volitelně ke konkrétnímu dni itineráře) nebo být osobní —
-- trip_id NULL = wishlist mimo výlet. Cascade na trips znamená,
-- že tvrdé smazání výletu odnese i jeho místa; soft-delete (koš)
-- je jen skryje, protože dotazy filtrují deleted_at IS NULL.
--
-- `geocode_cache` je sdílená mezipaměť odpovědí Nominatimu —
-- šetří jeho rate limit a zrychluje dávkový import z itineráře.
--
-- Safe to run repeatedly (idempotent) on existing databases.
-- Run with:  mysql -u <user> -p <db> < server/migrations/005_places.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS trip_places (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      INT UNSIGNED NOT NULL COMMENT 'Kdo místo vytvořil',
    trip_id      INT UNSIGNED NULL COMMENT 'NULL = osobní místo mimo výlet',
    day_index    INT UNSIGNED NULL COMMENT 'Volitelná vazba na den itineráře',
    name         VARCHAR(255) NOT NULL,
    address      VARCHAR(500) NULL,
    lat          DECIMAL(9,6) NOT NULL,
    lng          DECIMAL(9,6) NOT NULL,
    category     ENUM('sight','food','stay','nature','activity','transport','other') NOT NULL DEFAULT 'other',
    status       ENUM('wishlist','visited') NOT NULL DEFAULT 'wishlist',
    note         TEXT NULL,
    country_code CHAR(2) NULL,
    city         VARCHAR(120) NULL,
    source       ENUM('manual','search','gps','itinerary') NOT NULL DEFAULT 'manual',
    sort_order   INT UNSIGNED NOT NULL DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_places_user (user_id),
    INDEX idx_places_trip (trip_id, day_index),
    INDEX idx_places_country (user_id, country_code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS geocode_cache (
    cache_key   VARCHAR(191) PRIMARY KEY COMMENT 'search:<sha1(q|lang)> nebo rev:<lat>,<lng>|<lang>',
    response    LONGTEXT NOT NULL COMMENT 'JSON pole normalizovaných výsledků',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_geocache_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
