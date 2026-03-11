-- ============================================================
-- Migration: Initial table creation
-- Project:   label_web (標籤列印系統)
-- Date:      2026-03-12
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. users (使用者)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL        PRIMARY KEY,
  username     VARCHAR(50)   NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,           -- bcrypt hashed
  createtime   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_by   VARCHAR(50)
);

COMMENT ON TABLE  users              IS '使用者帳號表';
COMMENT ON COLUMN users.username     IS '帳號';
COMMENT ON COLUMN users.password     IS '密碼 (bcrypt)';
COMMENT ON COLUMN users.createtime   IS '建立時間';
COMMENT ON COLUMN users.updated_by   IS '最後更新者帳號';

-- ------------------------------------------------------------
-- 2. products (商品主檔)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id           SERIAL        PRIMARY KEY,
  品號          VARCHAR(50)   NOT NULL UNIQUE,
  對照號        VARCHAR(50),
  品名          VARCHAR(200)  NOT NULL,
  單箱數量      INT,
  createtime   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_by   VARCHAR(50)
);

COMMENT ON TABLE  products           IS '商品主檔';
COMMENT ON COLUMN products.品號      IS '商品品號 (唯一鍵)';
COMMENT ON COLUMN products.對照號    IS '對照品號';
COMMENT ON COLUMN products.品名      IS '商品名稱';
COMMENT ON COLUMN products.單箱數量  IS '每箱數量，用於計算總箱數';
COMMENT ON COLUMN products.createtime IS '建立時間';
COMMENT ON COLUMN products.updated_by IS '最後更新者帳號';

-- ------------------------------------------------------------
-- 3. print_records (列印記錄)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS print_records (
  id           SERIAL        PRIMARY KEY,
  品號          VARCHAR(50)   NOT NULL,
  品名          VARCHAR(200),
  列印數量      INT,
  createtime   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  username     VARCHAR(50)
);

COMMENT ON TABLE  print_records          IS '列印記錄';
COMMENT ON COLUMN print_records.品號     IS '商品品號';
COMMENT ON COLUMN print_records.品名     IS '商品名稱 (列印當下快照)';
COMMENT ON COLUMN print_records.列印數量 IS '本次列印數量';
COMMENT ON COLUMN print_records.createtime IS '列印時間';
COMMENT ON COLUMN print_records.username   IS '操作帳號';

-- ------------------------------------------------------------
-- 4. Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_品號
  ON products(品號);

CREATE INDEX IF NOT EXISTS idx_print_records_createtime
  ON print_records(createtime DESC);

CREATE INDEX IF NOT EXISTS idx_print_records_品號
  ON print_records(品號);

COMMIT;
