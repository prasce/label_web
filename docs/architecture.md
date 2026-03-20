# System Architecture — 標籤列印系統 (Label Web)

## System Overview

```
Browser (React SPA)
        |
        |  HTTP / JSON  (VITE_API_URL, default port 3000)
        v
Fastify API Server (Node.js + TypeScript)
        |
        |  mssql ConnectionPool  (port 1433)
        v
Microsoft SQL Server  (label_web database)
```

All browser-to-API traffic uses JSON over HTTP.
Authentication is stateless: a JWT is issued on login and sent as a
`Bearer` token on every subsequent request.

---

## Frontend Architecture

### Pages

```
src/pages/
  LoginPage.tsx         /login    Public. Left purple gradient, right white form.
  IndexPage.tsx         /         Protected. Dashboard / home.
  PrintLabelPage.tsx    /print    Protected. Print label form + preview.
  UploadPage.tsx        /upload   Protected. Excel batch product import.
  PrintRecordsPage.tsx  /records  Protected. History table with client-side search.
```

### Components

```
src/components/
  Navbar.tsx          Top bar. Calls openTab() — never <Link> directly.
  TabBar.tsx          Horizontal tab strip rendered below Navbar.
  PrivateRoute.tsx    HOC: reads JWT from localStorage; redirects to /login if absent.
```

### Contexts

```
src/contexts/
  TabContext.tsx       Provides { tabs, openTab, closeTab } via React context.
                       TabProvider MUST be inside <BrowserRouter> (uses useNavigate).
```

PATH_LABELS lookup table maps route paths to human-readable tab labels:

```
/         ->  首頁
/print    ->  標籤列印
/upload   ->  商品上傳
/records  ->  列印記錄
```

### API Layer

```
src/api/
  client.ts         Axios instance. Reads VITE_API_URL. Attaches JWT header.
                    Response interceptor: 401 -> clear token -> redirect /login.
  auth.ts           login(), register()
  products.ts       getProduct(品號), batchUpload(formData)
  printRecords.ts   getPrintRecords(), createRecord(payload)
```

### Utilities

```
src/utils/
  date.ts           isValidYYYYMMDD(str): boolean
                    formatDateDisplay(str): string  (yyyymmdd -> yyyy/mm/dd)
```

### Routing (App.tsx)

```
<BrowserRouter>
  <TabProvider>          <- must be inside BrowserRouter
    <Navbar />
    <TabBar />
    <Routes>
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/"        element={<PrivateRoute><IndexPage /></PrivateRoute>} />
      <Route path="/print"   element={<PrivateRoute><PrintLabelPage /></PrivateRoute>} />
      <Route path="/upload"  element={<PrivateRoute><UploadPage /></PrivateRoute>} />
      <Route path="/records" element={<PrivateRoute><PrintRecordsPage /></PrivateRoute>} />
    </Routes>
  </TabProvider>
</BrowserRouter>
```

---

## Backend Architecture

### Entry Point (`src/index.ts`)

- Creates a Fastify instance with JSON schema validation enabled
- Registers `@fastify/cors`, `@fastify/multipart` plugins
- Registers JWT middleware as a global `preHandler` hook
  (exempts `/api/auth/*` routes)
- Registers all route modules
- Listens on `PORT` from env (default 3000)

### Middleware (`src/middleware/auth.ts`)

```
Request header: Authorization: Bearer <token>
  |
  v
jwt.verify(token, JWT_SECRET)
  |- valid   -> attach decoded payload to request.user; continue
  +- invalid -> reply 401 Unauthorized
```

### Routes

```
src/routes/
  auth.ts
    POST /api/auth/login      bcrypt.compare -> jwt.sign -> { token }
    POST /api/auth/register   check dup -> bcrypt.hash -> INSERT users

  products.ts
    GET  /api/products/:品號   SELECT from products WHERE 品號 = @品號
    POST /api/products/batch  multipart -> exceljs parse -> MERGE INTO products

  printRecords.ts
    GET  /api/print-records   SELECT TOP 500 ORDER BY createtime DESC
    POST /api/print-records   INSERT INTO print_records
```

### Database Pool (`src/db/pool.ts`)

```ts
const pool = new mssql.ConnectionPool({
  server:   process.env.DB_SERVER,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt:              process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
  },
});
```

A single ConnectionPool is shared across all routes (singleton pattern).
Named parameters (`@param`) are used for all queries — never string interpolation.

---

## Database

### Tables and Relationships

```
users
  id           INT IDENTITY(1,1) PK
  username     NVARCHAR(50)  UNIQUE NOT NULL
  password     NVARCHAR(255) NOT NULL          -- bcrypt hash
  createtime   DATETIME2     DEFAULT GETDATE()
  updated_by   NVARCHAR(50)

products
  id           INT IDENTITY(1,1) PK
  品號          NVARCHAR(50)  UNIQUE NOT NULL   -- natural key, UPSERT target
  對照號        NVARCHAR(50)
  品名          NVARCHAR(200) NOT NULL
  單箱數量      INT
  createtime   DATETIME2     DEFAULT GETDATE()
  updated_by   NVARCHAR(50)

print_records
  id           INT IDENTITY(1,1) PK
  品號          NVARCHAR(50)  NOT NULL          -- soft reference, no FK
  品名          NVARCHAR(200)                   -- snapshot at print time
  列印數量      INT
  createtime   DATETIME2     DEFAULT GETDATE()
  username     NVARCHAR(50)                    -- soft reference to users.username
```

`print_records` intentionally has no foreign keys. 品名 is stored as a snapshot
so historical records remain accurate even if the product is updated later.

### UPSERT Pattern

```sql
MERGE INTO products WITH (HOLDLOCK) AS target
USING (VALUES (@品號, @對照號, @品名, @單箱數量))
  AS source (品號, 對照號, 品名, 單箱數量)
ON target.品號 = source.品號
WHEN MATCHED THEN
  UPDATE SET 對照號 = source.對照號,
             品名 = source.品名,
             單箱數量 = source.單箱數量,
             updated_by = @username
WHEN NOT MATCHED THEN
  INSERT (品號, 對照號, 品名, 單箱數量, updated_by)
  VALUES (source.品號, source.對照號, source.品名, source.單箱數量, @username);
```

`WITH (HOLDLOCK)` prevents phantom reads during concurrent batch uploads.

---

## Auth Flow

### Login

```
1. User submits username + password
2. POST /api/auth/login
3. Backend: SELECT user WHERE username = @username
4. If no row: return 401
5. bcrypt.compare(requestPassword, storedHash)
6. If false: return 401
7. jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '8h' })
8. Return { token }
9. Frontend stores token in localStorage
10. Axios client.ts attaches token on every subsequent request
```

### Protected Request

```
1. Axios request interceptor adds Authorization: Bearer <token>
2. Fastify preHandler: jwt.verify(token, JWT_SECRET)
3. If valid: request.user = decoded payload; route handler executes
4. If invalid/expired: reply 401
5. Axios response interceptor: 401 -> clear localStorage -> window.location = /login
```

### Remember Me

```
On successful login:
  localStorage.setItem('rememberedUsername', username)
  localStorage.setItem('rememberedPassword', password)

On LoginPage mount:
  Read these values and pre-fill the form fields
```

---

## Data Flows

### Print Label Flow

```
User fills form (品號, 總進貨數量, dates)
  |
  | blur on 品號
  v
GET /api/products/:品號
  -> fills 對照號, 品名, 單箱數量 (read-only)
  -> computes 總箱數 = floor(總進貨 / 單箱)
  |
  | user clicks Print
  v
Validate: 品號 required, 總進貨數量 > 0, 2-of-3 dates valid
  |
  v
Render label components (one per box, position: absolute)
window.print()
  |
  v
POST /api/print-records { 品號, 品名, 列印數量, username }
```

### Upload Products Flow

```
User selects .xlsx / .xls file
  |
  v
POST /api/products/batch (multipart/form-data)
  |
  v
Backend: exceljs.load(buffer)
  -> skip row 1 (header)
  -> for each data row: extract A/B/C/D columns
  -> MERGE INTO products WITH (HOLDLOCK)
  -> collect { successCount, failedRows }
  |
  v
Frontend displays result: "X 筆成功, Y 筆失敗"
+ table of failed rows with reasons
```

### View Print Records Flow

```
Component mounts
  |
  v
GET /api/print-records
  -> SELECT TOP 500 ... ORDER BY createtime DESC
  |
  v
Frontend stores records in state
User types in search box
  -> client-side filter on 品號 / 品名 / username (no extra API call)
```

---

## Key Technical Decisions

### Why Fastify instead of Express?

Fastify provides built-in JSON schema validation, better TypeScript types, and
higher throughput. It reduces boilerplate for route definitions and integrates
well with the plugin ecosystem (cors, multipart).

### Why mssql instead of pg?

The deployment environment uses Microsoft SQL Server (on-premises or Azure SQL).
The `mssql` package provides a `ConnectionPool` with named parameters, streaming,
and Azure AD authentication support. See `docs/decisions/mssql-migration.md` for
the full ADR.

### Why exceljs instead of xlsx (SheetJS)?

The `xlsx` (SheetJS community edition) package has known security vulnerabilities.
`exceljs` is actively maintained, supports both `.xlsx` and `.xls`, and provides
a clean streaming/buffer API that integrates well with Fastify's multipart plugin.

### Why snapshot 品名 in print_records?

Products can be renamed or deleted after a label is printed. Storing 品名 as a
snapshot in `print_records` ensures that the historical print record always shows
the name that was printed, even if the product master data changes later.

### Why position: absolute for label printing?

CSS `position: fixed` is relative to the viewport — when printing multiple labels,
the browser collapses them all onto a single page. Using `position: absolute` within
a container that grows with content allows each label to flow correctly onto
sequential pages.

### Why no foreign keys in print_records?

A strict FK from `print_records.品號` to `products.品號` would prevent deleting a
product that has ever been printed. The business requirement is to allow product
maintenance (including deletion) without affecting print history. A soft reference
is used instead.
