-- ============================================================
-- NOVA Store — database/schema.sql
-- PostgreSQL / Supabase version
-- Run once in Supabase SQL Editor
-- ============================================================


-- ── CATEGORIES (must come first — products references it) ───
-- Product categories shown in the store navigation and filter pills.
CREATE TABLE IF NOT EXISTS categories (
  id      SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug    TEXT NOT NULL UNIQUE
);


-- ── CATEGORY SIZES ───────────────────────────────────────────
-- Default size options for each category.
-- Used in the admin product editor to pre-fill size checkboxes.
CREATE TABLE IF NOT EXISTS category_sizes (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  size_label  TEXT    NOT NULL
);


-- ── PRODUCTS ─────────────────────────────────────────────────
-- Core product table. Name and description stored in both EN and AR.
-- active=false hides the product from the store without deleting it.
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name_en     TEXT    NOT NULL,
  name_ar     TEXT    NOT NULL,
  desc_en     TEXT    NOT NULL DEFAULT '',
  desc_ar     TEXT    NOT NULL DEFAULT '',
  category_id INTEGER NOT NULL REFERENCES categories(id),
  price       NUMERIC(10,2) NOT NULL,
  old_price   NUMERIC(10,2),
  stock       INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── PRODUCT COLORS ───────────────────────────────────────────
-- Each product can have multiple color variants.
-- hex is the display swatch color (e.g. '#D4AF37'), NULL for multi-color.
CREATE TABLE IF NOT EXISTS product_colors (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_en    TEXT    NOT NULL,
  name_ar    TEXT    NOT NULL,
  hex        TEXT
);


-- ── PRODUCT IMAGES ───────────────────────────────────────────
-- Images belong to a specific color variant.
-- sort_order controls display sequence (0 = primary image).
CREATE TABLE IF NOT EXISTS product_images (
  id         SERIAL PRIMARY KEY,
  color_id   INTEGER NOT NULL REFERENCES product_colors(id) ON DELETE CASCADE,
  url        TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);


-- ── PRODUCT SIZES ────────────────────────────────────────────
-- Per-product size options with individual stock counts.
CREATE TABLE IF NOT EXISTS product_sizes (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_label TEXT    NOT NULL,
  stock      INTEGER NOT NULL DEFAULT 0
);


-- ── ORDERS ───────────────────────────────────────────────────
-- Stores every customer order placed through the store.
-- items is a JSONB array of cart items.
CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  order_number     TEXT         NOT NULL UNIQUE,
  customer_name    TEXT         NOT NULL,
  customer_address TEXT         NOT NULL,
  customer_phone   TEXT         NOT NULL,
  items            JSONB        NOT NULL,
  total            NUMERIC(10,2) NOT NULL,
  status           TEXT         NOT NULL DEFAULT 'pending',
  lang             TEXT         NOT NULL DEFAULT 'en',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ── NEWSLETTER SUBSCRIBERS ───────────────────────────────────
-- Email addresses collected from the newsletter popup on the store.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         SERIAL PRIMARY KEY,
  email      TEXT        NOT NULL UNIQUE,
  lang       TEXT        NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── REVIEWS ──────────────────────────────────────────────────
-- Customer reviews submitted on the store.
-- verified=false means pending moderation.
CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stars      INTEGER     NOT NULL CHECK (stars BETWEEN 1 AND 5),
  text_en    TEXT        NOT NULL,
  text_ar    TEXT        NOT NULL DEFAULT '',
  author     TEXT        NOT NULL,
  verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── ADMIN USERS ──────────────────────────────────────────────
-- Admin accounts for the /admin dashboard.
-- Passwords stored as bcrypt hashes — never plain text.
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── RATE LIMIT LOG ───────────────────────────────────────────
-- Logs API requests per IP for rate limiting fallback.
-- In production, Upstash Redis handles this instead.
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id         SERIAL PRIMARY KEY,
  ip         TEXT        NOT NULL,
  endpoint   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);