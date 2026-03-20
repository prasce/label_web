# Skill: db-migrate

## Description

Handles creating, reviewing, and applying Microsoft SQL Server migration SQL files.
Migrations live in `database/migrations/` and must be idempotent so they can be
safely re-run. This skill covers the file naming convention, MSSQL-safe syntax,
and the exact command to execute migrations against the running database container.

## Trigger

Use this skill when the user asks to:
- Apply a schema change to the live database
- Create a new migration SQL file
- Check whether a migration has already been applied
- Understand MSSQL-specific migration syntax differences from PostgreSQL
- Roll back or inspect a migration

## Files to Read

Always read these files before creating a migration:

1. `database/migrations/` — list existing migration files to choose the next date prefix
2. `CLAUDE.md` — current schema block (use as the authoritative before-state)
3. The specific backend route file affected (to understand current column usage)

## Migration File Conventions

### Naming

```
database/migrations/YYYYMMDD_short_description.sql
```

Example: `20260320_add_barcode_to_products.sql`

Use today's date (`2026-03-20` -> `20260320`). If multiple migrations are created on
the same day, add a sequence suffix: `20260320_001_...sql`, `20260320_002_...sql`.

### Idempotency Guards

Every DDL statement must be wrapped in an existence check so the migration is safe
to re-run:

**Add a column:**
```sql
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.table_name') AND name = N'column_name'
)
BEGIN
  ALTER TABLE table_name ADD column_name NVARCHAR(100) NULL;
END
GO
```

**Create a table:**
```sql
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'table_name')
BEGIN
  CREATE TABLE table_name (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    some_field NVARCHAR(100) NOT NULL,
    createtime DATETIME2 DEFAULT GETDATE()
  );
END
GO
```

**Add an index:**
```sql
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.table_name') AND name = N'IX_table_name_column'
)
BEGIN
  CREATE INDEX IX_table_name_column ON table_name (column_name);
END
GO
```

**Drop a column (use with caution):**
```sql
IF EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.table_name') AND name = N'old_column'
)
BEGIN
  ALTER TABLE table_name DROP COLUMN old_column;
END
GO
```

## Applying a Migration

### Local Docker (MSSQL container named `sql`)

```bash
docker exec sql /opt/mssql-tools/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P 'YourStrong@Passw0rd' \
  -d label_web \
  -i /path/to/migration.sql
```

To copy the file into the container first:
```bash
docker cp database/migrations/20260320_add_barcode_to_products.sql \
  sql:/tmp/migration.sql

docker exec sql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong@Passw0rd' \
  -d label_web -i /tmp/migration.sql
```

### Direct sqlcmd (installed locally)

```bash
sqlcmd -S localhost,1433 -U sa -P 'YourStrong@Passw0rd' \
  -d label_web \
  -i database/migrations/20260320_add_barcode_to_products.sql
```

### Azure SQL / Production

Replace `-S localhost` with the Azure SQL server FQDN and use the production
credentials from the deployment environment. Ensure `DB_ENCRYPT=true` and
`DB_TRUST_CERT=false` in the backend `.env` for production.

## Verifying a Migration

**Check that a table exists:**
```sql
SELECT name FROM sys.tables WHERE name = N'table_name';
```

**Check that a column exists:**
```sql
SELECT name, max_length, is_nullable
FROM sys.columns
WHERE object_id = OBJECT_ID(N'dbo.table_name');
```

**Check all tables in the database:**
```sql
SELECT name FROM sys.tables ORDER BY name;
```

Run these via sqlcmd or in Azure Data Studio / SSMS.

## Full Migration Workflow

1. **Read** the current schema in `CLAUDE.md` and `database/migrations/`.
2. **Create** `database/migrations/YYYYMMDD_description.sql` with idempotent DDL.
3. **Update** the schema block in `CLAUDE.md` to reflect the post-migration state.
4. **Update** backend routes and frontend types (use db-schema skill if needed).
5. **Apply** the migration using the sqlcmd command above.
6. **Verify** with `SELECT` queries against `sys.tables` / `sys.columns`.
7. **Run type-check**: `cd backend && npx tsc --noEmit` and
   `cd frontend && npx tsc --noEmit`.

## MSSQL vs PostgreSQL Syntax Reference

| Operation        | PostgreSQL                     | MSSQL                                      |
|------------------|--------------------------------|--------------------------------------------|
| Auto-increment   | SERIAL / BIGSERIAL             | INT IDENTITY(1,1)                          |
| Upsert           | ON CONFLICT (...) DO UPDATE    | MERGE INTO ... WITH (HOLDLOCK)             |
| Limit rows       | LIMIT N                        | SELECT TOP N                               |
| Current time     | NOW()                          | GETDATE() or SYSDATETIMEOFFSET()           |
| Unicode text     | TEXT / VARCHAR                 | NVARCHAR(n) or NVARCHAR(MAX)               |
| Boolean          | BOOLEAN                        | BIT (0 or 1)                               |
| Existence check  | IF NOT EXISTS (DDL)            | IF NOT EXISTS (...) BEGIN ... END GO       |
| Param binding    | $1, $2, ...                    | @param1, @param2, ...                      |
| String concat    | ||                             | + (use CONCAT() for null safety)           |

## Validation Checklist

- [ ] Migration file name follows `YYYYMMDD_description.sql` convention
- [ ] All DDL statements are wrapped in idempotency guards
- [ ] Chinese column names use `NVARCHAR`, not `VARCHAR`
- [ ] `GO` batch separator appears after each statement block
- [ ] `CLAUDE.md` schema block updated to reflect post-migration state
- [ ] Migration applied successfully (sqlcmd exits with no errors)
- [ ] Verified with `sys.tables` / `sys.columns` queries
- [ ] Backend and frontend updated and `tsc --noEmit` passes

## Output

After completing a migration, report:
- Migration file path created (absolute)
- Tables and columns added, modified, or removed
- Output of the sqlcmd apply command (success or error)
- Verification query result
- Result of `tsc --noEmit` for both packages
