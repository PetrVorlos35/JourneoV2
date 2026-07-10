-- ============================================================
-- Journeo V2 – MariaDB Database Schema
-- Database: voreldb
-- ============================================================

-- ── Uživatelé ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    avatar_url TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    bank_account VARCHAR(64) DEFAULT NULL COMMENT 'Číslo účtu / IBAN pro vyrovnání dluhů',
    invite_token VARCHAR(64) UNIQUE NULL DEFAULT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_verified TINYINT(1) DEFAULT 0,
    token_version INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Bump zneplatní všechny dříve vydané JWT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Uživatelská nastavení ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    theme ENUM('dark', 'light', 'system') DEFAULT 'dark',
    currency VARCHAR(10) DEFAULT 'CZK',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Výlety ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    share_token VARCHAR(64) UNIQUE NULL DEFAULT NULL,
    budget_target DECIMAL(12,2) NULL DEFAULT NULL,
    deleted_at DATETIME NULL DEFAULT NULL COMMENT 'Non-NULL = výlet je v koši; po 30 dnech se maže natvrdo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_trips_user (user_id),
    INDEX idx_trips_deleted (deleted_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Denní plány (itinerář) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_activities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id INT UNSIGNED NOT NULL,
    day_index INT UNSIGNED NOT NULL COMMENT 'Pořadí dne (0, 1, 2, ...)',
    date DATE NOT NULL,
    title VARCHAR(255) DEFAULT '' COMMENT 'Název dne, např. Den 1',
    plan TEXT DEFAULT '' COMMENT 'Textový plán pro den',
    location VARCHAR(255) DEFAULT '' COMMENT 'Lokace / město',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_activities_trip (trip_id),
    UNIQUE KEY uq_trip_day (trip_id, day_index),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Výdaje ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_expenses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id INT UNSIGNED NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    category ENUM('transport', 'accommodation', 'food', 'activities', 'other') DEFAULT 'other',
    date DATE DEFAULT NULL,
    paid_by INT UNSIGNED DEFAULT NULL COMMENT 'Uživatel, který výdaj zaplatil (NULL = osobní výdaj bez rozdělení)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_expenses_trip (trip_id),
    INDEX idx_expenses_paid_by (paid_by),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Rozdělení výdajů (kdo komu kolik dluží) ──────────────────
-- Junction table: jeden řádek = podíl jednoho účastníka na jednom výdaji.
CREATE TABLE IF NOT EXISTS expense_splits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    expense_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Částka, kterou tento účastník dluží za daný výdaj',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_expense_user (expense_id, user_id),
    INDEX idx_splits_expense (expense_id),
    INDEX idx_splits_user (user_id),
    FOREIGN KEY (expense_id) REFERENCES trip_expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Vyrovnání dluhů (settle up) ──────────────────────────────
-- Each row is a compensating payment: from_user paid to_user `amount`,
-- which the balance engine folds in to zero out their debt.
CREATE TABLE IF NOT EXISTS trip_settlements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id INT UNSIGNED NOT NULL,
    from_user_id INT UNSIGNED NOT NULL COMMENT 'Plátce (dlužník)',
    to_user_id INT UNSIGNED NOT NULL COMMENT 'Příjemce (věřitel)',
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_settlements_trip (trip_id),
    INDEX idx_settlements_from (from_user_id),
    INDEX idx_settlements_to (to_user_id),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Balící seznam ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_packing_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id INT UNSIGNED NOT NULL,
    text VARCHAR(255) NOT NULL,
    checked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_packing_trip (trip_id),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Odkazy a poznámky ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_documents (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_documents_trip (trip_id),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Přátelství ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    requester_id INT UNSIGNED NOT NULL,
    addressee_id INT UNSIGNED NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_friendship (requester_id, addressee_id),
    INDEX idx_friendship_addressee (addressee_id),
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Notifikace ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type ENUM('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'TRIP_VOTED') NOT NULL,
    reference_id INT UNSIGNED DEFAULT NULL COMMENT 'ID přátelství nebo výletu',
    message TEXT DEFAULT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notif_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Hlasování (Reddit-style) ────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    trip_id INT UNSIGNED NOT NULL,
    value TINYINT NOT NULL COMMENT '1 = upvote, -1 = downvote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_user_trip_vote (user_id, trip_id),
    INDEX idx_vote_trip (trip_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Spolupracovníci na výletech ─────────────────────────────
CREATE TABLE IF NOT EXISTS trip_collaborators (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    role ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_trip_user (trip_id, user_id),
    INDEX idx_collab_user (user_id),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Ověřovací tokeny ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    type ENUM('REGISTER', 'RESET') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tokens_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Sdílené počítadlo rate limitů ────────────────────────────
-- In-memory počítadla express-rate-limit nejsou na serverless sdílená
-- mezi instancemi; tahle tabulka ano (viz lib/dbRateStore.js).
CREATE TABLE IF NOT EXISTS rate_limits (
    rl_key VARCHAR(191) PRIMARY KEY,
    hits INT UNSIGNED NOT NULL DEFAULT 1,
    reset_at DATETIME NOT NULL,

    INDEX idx_rate_limits_reset (reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
