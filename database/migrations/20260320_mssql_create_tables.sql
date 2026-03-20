-- ============================================================
-- Migration: Initial table creation (Microsoft SQL Server)
-- Project:   label_web (標籤列印系統)
-- Date:      2026-03-20
-- ============================================================

BEGIN TRANSACTION;

-- ------------------------------------------------------------
-- 1. users (使用者)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'users')
BEGIN
  CREATE TABLE users (
    id         INT            IDENTITY(1,1) PRIMARY KEY,
    username   NVARCHAR(50)   NOT NULL UNIQUE,
    password   NVARCHAR(255)  NOT NULL,           -- bcrypt hashed
    createtime DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    updated_by NVARCHAR(50)
  );
END;

-- ------------------------------------------------------------
-- 2. products (商品主檔)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'products')
BEGIN
  CREATE TABLE products (
    id         INT            IDENTITY(1,1) PRIMARY KEY,
    品號        NVARCHAR(50)   NOT NULL UNIQUE,
    對照號      NVARCHAR(50),
    品名        NVARCHAR(200)  NOT NULL,
    單箱數量    INT,
    createtime DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    updated_by NVARCHAR(50)
  );
END;

-- ------------------------------------------------------------
-- 3. print_records (列印記錄)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'print_records')
BEGIN
  CREATE TABLE print_records (
    id         INT            IDENTITY(1,1) PRIMARY KEY,
    品號        NVARCHAR(50)   NOT NULL,
    品名        NVARCHAR(200),
    列印數量    INT,
    createtime DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    username   NVARCHAR(50)
  );
END;

-- ------------------------------------------------------------
-- 4. Indexes
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_品號' AND object_id = OBJECT_ID('products'))
  CREATE INDEX idx_products_品號 ON products(品號);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_print_records_createtime' AND object_id = OBJECT_ID('print_records'))
  CREATE INDEX idx_print_records_createtime ON print_records(createtime DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_print_records_品號' AND object_id = OBJECT_ID('print_records'))
  CREATE INDEX idx_print_records_品號 ON print_records(品號);

COMMIT TRANSACTION;
