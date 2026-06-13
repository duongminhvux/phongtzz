-- =========================================================
-- Homestay Booking Request - PostgreSQL schema
-- Tables:
-- admins
-- rooms
-- booking_requests
-- landing_page_settings
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bookingstatus') THEN
        CREATE TYPE bookingstatus AS ENUM (
            'NEW',
            'CONTACTED',
            'CONFIRMED',
            'CANCELLED'
        );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- admins
-- =========================

CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_admins_email
ON admins (email);

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;

CREATE TRIGGER trg_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- rooms
-- =========================

CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    "type" VARCHAR(50) NOT NULL DEFAULT 'private',
    price INTEGER,
    original_price INTEGER,
    capacity INTEGER,
    beds INTEGER,
    bed_type VARCHAR(255),
    size VARCHAR(100),
    description TEXT,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT rooms_price_check CHECK (price IS NULL OR price >= 0),
    CONSTRAINT rooms_original_price_check CHECK (original_price IS NULL OR original_price >= 0),
    CONSTRAINT rooms_capacity_check CHECK (capacity IS NULL OR capacity >= 1),
    CONSTRAINT rooms_beds_check CHECK (beds IS NULL OR beds >= 0)
);

CREATE INDEX IF NOT EXISTS ix_rooms_slug
ON rooms (slug);

CREATE INDEX IF NOT EXISTS ix_rooms_is_active
ON rooms (is_active);

CREATE INDEX IF NOT EXISTS ix_rooms_sort_order
ON rooms (sort_order);

DROP TRIGGER IF EXISTS trg_rooms_updated_at ON rooms;

CREATE TRIGGER trg_rooms_updated_at
BEFORE UPDATE ON rooms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- booking_requests
-- =========================

CREATE TABLE IF NOT EXISTS booking_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,

    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(255),

    check_in DATE,
    check_out DATE,
    guests INTEGER,

    message TEXT,

    status bookingstatus NOT NULL DEFAULT 'NEW',
    internal_note TEXT,

    source VARCHAR(255),
    page_url VARCHAR(1000),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),

    room_id VARCHAR(36),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_booking_requests_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE SET NULL,

    CONSTRAINT booking_requests_guests_check
        CHECK (guests IS NULL OR guests >= 1),

    CONSTRAINT booking_requests_dates_check
        CHECK (
            check_in IS NULL
            OR check_out IS NULL
            OR check_out > check_in
        )
);

CREATE INDEX IF NOT EXISTS ix_booking_requests_phone
ON booking_requests (phone);

CREATE INDEX IF NOT EXISTS ix_booking_requests_check_in
ON booking_requests (check_in);

CREATE INDEX IF NOT EXISTS ix_booking_requests_status
ON booking_requests (status);

CREATE INDEX IF NOT EXISTS ix_booking_requests_created_at
ON booking_requests (created_at);

CREATE INDEX IF NOT EXISTS ix_booking_requests_room_id
ON booking_requests (room_id);

DROP TRIGGER IF EXISTS trg_booking_requests_updated_at ON booking_requests;

CREATE TRIGGER trg_booking_requests_updated_at
BEFORE UPDATE ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- landing_page_settings
-- =========================

CREATE TABLE IF NOT EXISTS landing_page_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key VARCHAR(100) NOT NULL UNIQUE DEFAULT 'default',
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_landing_page_settings_key
ON landing_page_settings (key);

DROP TRIGGER IF EXISTS trg_landing_page_settings_updated_at ON landing_page_settings;

CREATE TRIGGER trg_landing_page_settings_updated_at
BEFORE UPDATE ON landing_page_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();