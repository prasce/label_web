# ADR-001: Migration from PostgreSQL to Microsoft SQL Server

| Field   | Value                    |
|---------|--------------------------|
| Date    | 2026-03-20               |
| Status  | Accepted                 |
| Deciders| Development Team         |

---

## Context

The Label Web application was originally built with **PostgreSQL** as the database
backend, using the `pg` (node-postgres) package. The initial schema used PostgreSQL
types (`SERIAL`, `VARCHAR`, `TIMESTAMPTZ`) and query patterns (`$1/$2` positional
parameters, `ON CONFLICT ... DO UPDATE` for upsert, `LIMIT N` for pagination).

The deployment target environment — both on-premises and Azure — runs
**Microsoft SQL Server**. Operating and maintaining a separate PostgreSQL instance
alongside SQL Server introduced unnecessary infrastructure overhead. The decision
was made to migrate the application database to SQL Server to align with the
organisation's existing data platform.

---

## Decision

Replace the `pg` package with the **`mssql`** package and migrate all SQL queries
to SQL Server syntax.

Specific choices made:

1. **Package**: `mssql` with `ConnectionPool` (singleton shared across routes)
2. **Parameter binding**: named `@param` style (not positional `$1, $2`)
3. **Upsert**: `MERGE INTO ... WITH (HOLDLOCK)` (replaces `ON CONFLICT`)
4. **Pagination**: `SELECT TOP N` (replaces `LIMIT N`)
5. **Auto-increment**: `INT IDENTITY(1,1)` (replaces `SERIAL`)
6. **Text columns**: `NVARCHAR(n)` (replaces `VARCHAR(n)`) for Unicode / Chinese support
7. **Timestamps**: `DATETIME2` (replaces `TIMESTAMPTZ`)
8. **Connection config**: two new env vars — `DB_ENCRYPT` and `DB_TRUST_CERT`

---

## New Environment Variables

Two variables were added to `backend/.env` to support the MSSQL connection:

| Variable       | Description                                             | Local dev | Production |
|----------------|---------------------------------------------------------|-----------|------------|
| DB_ENCRYPT     | Whether to encrypt the connection (required for Azure)  | false     | true       |
| DB_TRUST_CERT  | Trust self-signed TLS cert (local MSSQL container only) | true      | false      |

The existing variables `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and
`DB_DATABASE` were kept with the same names; only their values changed.

---

## SQL Syntax Differences

| Operation            | PostgreSQL (old)                                         | MSSQL (new)                                                         |
|----------------------|----------------------------------------------------------|---------------------------------------------------------------------|
| Auto-increment PK    | `id SERIAL PRIMARY KEY`                                  | `id INT IDENTITY(1,1) PRIMARY KEY`                                  |
| Unicode text         | `VARCHAR(n)`                                             | `NVARCHAR(n)`                                                       |
| Current timestamp    | `DEFAULT NOW()`                                          | `DEFAULT GETDATE()`                                                 |
| Timestamp type       | `TIMESTAMPTZ`                                            | `DATETIME2`                                                         |
| Query parameters     | `WHERE username = $1` + `[username]`                     | `WHERE username = @username` + `.input('username', username)`       |
| Upsert               | `INSERT ... ON CONFLICT (品號) DO UPDATE SET ...`         | `MERGE INTO products WITH (HOLDLOCK) ... WHEN MATCHED THEN UPDATE ...` |
| Limit rows           | `SELECT ... LIMIT 500`                                   | `SELECT TOP 500 ...`                                                |
| Check row returned   | `result.rowCount === 0` (`rowCount` can be null in pg v8)| `result.recordset.length === 0` (always an array)                   |
| Boolean type         | `BOOLEAN` (`true`/`false`)                               | `BIT` (`1`/`0`)                                                     |
| String concatenation | `col1 \|\| col2`                                          | `col1 + col2` or `CONCAT(col1, col2)`                               |
| Idempotent DDL       | `CREATE TABLE IF NOT EXISTS ...`                         | `IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name=N'...') BEGIN ... END GO` |

---

## Breaking Changes

The following breaking changes were introduced by this migration:

1. **`pg` package removed** — any code using `new Pool()` from `pg` must be replaced
   with `pool.request()` from the `mssql` `ConnectionPool`.
2. **Positional parameters removed** — all `$1`, `$2` placeholders must be replaced
   with `@paramName` and `.input('paramName', value)` calls.
3. **`ON CONFLICT` syntax removed** — all upsert logic must use `MERGE INTO`.
4. **`LIMIT` removed** — all pagination must use `SELECT TOP N`.
5. **`result.rowCount` removed** — replaced by `result.recordset.length` (MSSQL
   `recordset` is always a typed array; the null-safety workaround for `pg v8`
   `rowCount` is no longer needed).
6. **Schema migration required** — the initial PostgreSQL tables must be dropped or
   the schema re-applied as MSSQL DDL. See `database/migrations/20260312_create_tables.sql`.

---

## Consequences

### Positive

- Single database engine across all environments (dev, staging, production)
- Native Azure SQL compatibility — no extra configuration for cloud deployment
- `mssql` `recordset` is always an array; eliminates the `pg v8` `rowCount: null` bug
- `NVARCHAR` natively handles Chinese characters without collation configuration
- Named parameters (`@param`) are more readable than positional `$1/$2`

### Negative

- `MERGE INTO ... WITH (HOLDLOCK)` is more verbose than `ON CONFLICT`
- `SELECT TOP N` does not support offset-based pagination as cleanly as
  `LIMIT N OFFSET M` (requires `ROW_NUMBER()` window function for deep pagination)
- MSSQL is not open-source; local development requires a Docker container
  (`mcr.microsoft.com/mssql/server`) or a SQL Server Express licence
- Team members familiar only with PostgreSQL need to learn MSSQL-specific syntax

---

## Azure SQL Compatibility Note

When deploying to Azure SQL Database or Azure SQL Managed Instance:

- Set `DB_ENCRYPT=true` and `DB_TRUST_CERT=false` in the backend `.env`
- The `mssql` driver uses TLS by default for Azure connections
- Azure SQL does not support `sa` login — use an Azure AD user or SQL login
  created during provisioning
- The connection string format remains the same; only the server FQDN changes
  (e.g. `your-server.database.windows.net`)

---

## Alternatives Considered

| Alternative               | Reason Not Chosen                                              |
|---------------------------|----------------------------------------------------------------|
| Keep PostgreSQL            | Deployment environment only has SQL Server licencing           |
| Use an ORM (TypeORM/Prisma)| Added complexity; team prefers explicit SQL for this use case  |
| Use Azure Cosmos DB        | Not relational; does not fit the tabular product/record model  |
| Use SQLite for dev + MSSQL for prod | Dialect differences would mask bugs during development |
