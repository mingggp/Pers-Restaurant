-- ============================================================
-- Per's Restaurant — PostgreSQL Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS (LINE Login customers)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id  TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  picture_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STAFF (kitchen / owner logins — username+password)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'kitchen', 'waiter')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,         -- 'rec', 'rice', 'main', 'drink', 'dessert'
  name        TEXT NOT NULL,
  name_en     TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id TEXT NOT NULL REFERENCES categories(id),
  name        TEXT NOT NULL,
  name_en     TEXT,
  description TEXT,
  price       INT NOT NULL,             -- in THB (no decimals)
  image_url   TEXT,
  is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  rating      NUMERIC(3,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- OPTION GROUPS (spicy, sweet, ice, extras)
-- ============================================================
CREATE TABLE IF NOT EXISTS option_groups (
  id          TEXT PRIMARY KEY,         -- 'spicy', 'sweet', 'ice', 'extras'
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('radio', 'checkbox')),
  is_required BOOLEAN NOT NULL DEFAULT FALSE
);

-- Which option groups apply to which category
CREATE TABLE IF NOT EXISTS category_option_groups (
  category_id      TEXT NOT NULL REFERENCES categories(id),
  option_group_id  TEXT NOT NULL REFERENCES option_groups(id),
  PRIMARY KEY (category_id, option_group_id)
);

-- Choices within an option group
CREATE TABLE IF NOT EXISTS option_choices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_group_id TEXT NOT NULL REFERENCES option_groups(id),
  name            TEXT NOT NULL,
  price_delta     INT NOT NULL DEFAULT 0,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INT NOT NULL DEFAULT 0
);

-- ============================================================
-- RESTAURANT TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id          INT PRIMARY KEY,          -- table number (1–12)
  qr_code     TEXT,                     -- QR code data
  status      TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'occupied', 'reserved')),
  label       TEXT,                     -- e.g. "โต๊ะ 5"
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number  SERIAL,                 -- human-readable #1234
  user_id       UUID REFERENCES users(id),
  table_id      INT REFERENCES restaurant_tables(id),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','paid','cooking','ready','served','cancelled','refunded')),
  subtotal      INT NOT NULL DEFAULT 0, -- before service charge
  service_fee   INT NOT NULL DEFAULT 0,
  total         INT NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'promptpay',
  payment_ref   TEXT,                   -- PromptPay transaction ref
  notes         TEXT,                   -- order-level note
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id   ON orders(table_id);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id),
  quantity      INT NOT NULL DEFAULT 1,
  unit_price    INT NOT NULL,           -- price at time of order (snapshot)
  note          TEXT,
  is_done       BOOLEAN NOT NULL DEFAULT FALSE,  -- kitchen per-item check-off
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================
-- ORDER ITEM OPTIONS (selected choices per item)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_item_options (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id     UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  option_group_id   TEXT NOT NULL REFERENCES option_groups(id),
  option_choice_id  UUID NOT NULL REFERENCES option_choices(id),
  price_delta       INT NOT NULL DEFAULT 0  -- snapshot at time of order
);

-- ============================================================
-- AUDIT LOG (for owner console)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id    UUID REFERENCES staff(id),
  action      TEXT NOT NULL,            -- 'order.refund', 'menu.edit', etc.
  entity_type TEXT,                     -- 'order', 'menu_item', etc.
  entity_id   TEXT,
  before_data JSONB,
  after_data  JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_staff_id   ON audit_log(staff_id);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_tables_updated_at
    BEFORE UPDATE ON restaurant_tables
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
