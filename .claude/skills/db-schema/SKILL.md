# Skill: db-schema

## Description

Handles reading, explaining, and modifying the Microsoft SQL Server database schema.
This covers the three core tables (users, products, print_records), MSSQL-specific
data types and constraints, and the full propagation workflow when a schema change is
needed (migration file → backend types/queries → frontend types).

## Trigger

Use this skill when the user asks about or requests changes to:
- Table structure, column types, or constraints
- Adding or renaming columns
- Understanding what a table's columns mean
- MSSQL-specific type choices (NVARCHAR vs VARCHAR, DATETIME2 vs DATETIME, IDENTITY)
- The database migration files in `database/migrations/`
- Keeping CLAUDE.md, backend routes, and frontend types in sync after a schema change

## Files to Read

Always read these files before making changes:

1. `database/migrations/20260312_create_tables.sql` — canonical schema source of truth
2. `CLAUDE.md` — schema block (must stay in sync with migrations)
3. `backend/src/routes/products.ts` — SQL queries referencing products columns
4. `backend/src/routes/printRecords.ts` — SQL queries referencing print_records columns
5. `backend/src/routes/auth.ts` — SQL queries referencing users columns
6. `backend/src/db/pool.ts` — MSSQL ConnectionPool configuration

## Current Schema

### users
```sql
CREATE TABLE users (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  username     NVARCHAR(50)  NOT NULL UNIQUE,
  password     NVARCHAR(255) NOT NULL,        -- bcrypt hashed, SALT_ROUNDS=12
  createtime   DATETIME2     DEFAULT GETDATE(),
  updated_by   NVARCHAR(50)
);
```

### products
```sql
CREATE TABLE products (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  品號          NVARCHAR(50)  NOT NULL UNIQUE,  -- UPSERT conflict key
  對照號        NVARCHAR(50),
  品名          NVARCHAR(200) NOT NULL,
  單箱數量      INT,
  createtime   DATETIME2     DEFAULT GETDATE(),
  updated_by   NVARCHAR(50)
);
```

### print_records
```sql
CREATE TABLE print_records (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  品號          NVARCHAR(50)  NOT NULL,
  品名          NVARCHAR(200),                 -- snapshot at print time, no FK
  列印數量      INT,
  createtime   DATETIME2     DEFAULT GETDATE(),
  username     NVARCHAR(50)
);
```

## Key MSSQL Type Decisions

| Concern           | MSSQL type         | Reason                                              |
|-------------------|--------------------|-----------------------------------------------------|
| Auto-increment PK | INT IDENTITY(1,1)  | Standard MSSQL pattern; no SERIAL or SEQUENCE needed|
| Text columns      | NVARCHAR(n)        | Unicode support for Chinese characters              |
| Timestamps        | DATETIME2          | Higher precision and range than DATETIME            |
| Boolean           | BIT                | 0/1; no native BOOLEAN in MSSQL                     |
| Large text        | NVARCHAR(MAX)      | Equivalent to TEXT in PostgreSQL                    |

## Steps for a Schema Change

1. **Read** all files listed above to understand the current state.
2. **Create a migration file** in `database/migrations/YYYYMMDD_description.sql`
   using MSSQL-safe, idempotent syntax (see template below).
3. **Update the schema block in `CLAUDE.md`** to reflect the new columns.
4. **Update backend route(s)** — add the new column to SELECT / INSERT / UPDATE
   queries; add named `@param` binding in the request object.
5. **Update frontend types** — add the new field to the TypeScript interface in
   `frontend/src/api/` that corresponds to the changed table.
6. **Run type-check**: `cd backend && npx tsc --noEmit` and
   `cd frontend && npx tsc --noEmit`.
7. **Apply migration** to the database (see db-migrate skill for the exact command).

## Migration File Template

```sql
-- database/migrations/YYYYMMDD_description.sql
-- Description: <what this migration does>

-- Add a column (idempotent)
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.products') AND name = N'new_column'
)
BEGIN
  ALTER TABLE products ADD new_column NVARCHAR(100) NULL;
END
GO

-- Create a table (idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'new_table')
BEGIN
  CREATE TABLE new_table (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    some_field NVARCHAR(100) NOT NULL,
    createtime DATETIME2 DEFAULT GETDATE()
  );
END
GO
```

## Validation Checklist

- [ ] Migration file is in `database/migrations/YYYYMMDD_description.sql`
- [ ] Migration uses `IF NOT EXISTS` guards for idempotency
- [ ] Chinese column names use `NVARCHAR`, not `VARCHAR`
- [ ] Auto-increment uses `INT IDENTITY(1,1)`, not `SERIAL`
- [ ] `CLAUDE.md` schema block has been updated
- [ ] Backend route queries include the new/changed column
- [ ] Named `@param` bindings are used — no SQL string interpolation
- [ ] Frontend TypeScript interfaces include the new field
- [ ] `tsc --noEmit` passes in both frontend and backend

## Output

After completing changes, report:
- Migration file path created
- Tables and columns affected
- Backend routes updated
- Frontend interfaces updated
- Result of `tsc --noEmit` for both packages
