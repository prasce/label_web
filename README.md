# 標籤列印系統 (Label Web)

商品標籤列印管理系統，支援使用者登入驗證、商品主檔上傳（Excel 批次匯入）、標籤列印與列印記錄查詢。

## Tech Stack

| Layer    | Technology                                           |
|----------|------------------------------------------------------|
| Frontend | React 18 + TypeScript + Vite + React Router + Axios  |
| Backend  | Node.js + Fastify + TypeScript                       |
| Database | Microsoft SQL Server (mssql)                         |
| Auth     | bcrypt (SALT_ROUNDS=12) + JSON Web Token (JWT)       |
| Excel    | exceljs (batch product upload)                       |

## Directory Structure

```
label_web/
├── CLAUDE.md                      # AI assistant instructions
├── README.md                      # This file
├── docs/
│   ├── architecture.md            # System architecture overview
│   └── decisions/
│       └── mssql-migration.md     # ADR: PostgreSQL -> MSSQL
├── .claude/
│   ├── settings.local.json
│   └── skills/
│       ├── print-label/SKILL.md
│       ├── upload-product/SKILL.md
│       ├── auth/SKILL.md
│       ├── db-schema/SKILL.md
│       ├── new-feature/SKILL.md
│       └── db-migrate/SKILL.md
├── backend/
│   ├── src/
│   │   ├── index.ts               # Fastify entry point (port 3000)
│   │   ├── db/pool.ts             # MSSQL ConnectionPool
│   │   ├── middleware/auth.ts     # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.ts            # POST /api/auth/login, /register
│   │   │   ├── products.ts        # GET /api/products/:品號, POST /api/products/batch
│   │   │   └── printRecords.ts    # GET / POST /api/print-records
│   │   └── utils/dateValidation.ts
│   ├── .env                       # Actual env vars — never commit
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── 上傳範本.xlsx           # Downloadable Excel template
│   ├── src/
│   │   ├── api/                   # client.ts / auth.ts / products.ts / printRecords.ts
│   │   ├── components/            # Navbar.tsx / PrivateRoute.tsx / TabBar.tsx
│   │   ├── contexts/              # TabContext.tsx
│   │   ├── pages/                 # LoginPage / IndexPage / PrintLabelPage / UploadPage / PrintRecordsPage
│   │   └── utils/date.ts
│   ├── .env.example
│   └── package.json
├── database/
│   └── migrations/
│       └── 20260312_create_tables.sql
└── scripts/sec.sh
```

## Quick Start

### Prerequisites

- Node.js >= 18
- Microsoft SQL Server (local, Docker, or Azure SQL)
- npm

### 1. Database Setup

```bash
# Create the label_web database and run the initial migration
sqlcmd -S localhost -U sa -P '<your_password>' -Q "CREATE DATABASE label_web"
sqlcmd -S localhost -U sa -P '<your_password>' -d label_web -i database/migrations/20260312_create_tables.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secret (see Environment Variables below)
npm install
npm run dev        # nodemon + ts-node, listens on port 3000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000
npm install
npm run dev        # Vite dev server, listens on port 5173
```

Open http://localhost:5173 in your browser.

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                                          | Example                       |
|----------------|------------------------------------------------------|-------------------------------|
| PORT           | Fastify listen port                                  | 3000                          |
| DB_SERVER      | MSSQL server host                                    | localhost                     |
| DB_PORT        | MSSQL port                                           | 1433                          |
| DB_USER        | Database username                                    | sa                            |
| DB_PASSWORD    | Database password                                    | YourStrong@Passw0rd           |
| DB_DATABASE    | Database name                                        | label_web                     |
| DB_ENCRYPT     | Encrypt connection (set true for Azure SQL)          | false                         |
| DB_TRUST_CERT  | Trust self-signed certificate (local dev only)       | true                          |
| JWT_SECRET     | Random 48-byte hex string                            | (generate — see below)        |
| SALT_ROUNDS    | bcrypt salt rounds                                   | 12                            |

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable       | Description              | Example                    |
|----------------|--------------------------|----------------------------|
| VITE_API_URL   | Backend API base URL     | http://localhost:3000      |

## API Endpoints

All endpoints except `/api/auth/login` and `/api/auth/register` require an
`Authorization: Bearer <token>` header.

| Method | Path                      | Description                          |
|--------|---------------------------|--------------------------------------|
| POST   | /api/auth/login           | Login — returns JWT                  |
| POST   | /api/auth/register        | Register new user                    |
| GET    | /api/products/:品號        | Fetch single product by 品號          |
| POST   | /api/products/batch       | Batch upsert products from Excel     |
| GET    | /api/print-records        | List latest 500 print records        |
| POST   | /api/print-records        | Create a new print record            |

## Database Tables

```sql
-- users
id           INT IDENTITY(1,1) PRIMARY KEY
username     NVARCHAR(50)  UNIQUE NOT NULL
password     NVARCHAR(255) NOT NULL        -- bcrypt hashed, SALT_ROUNDS=12
createtime   DATETIME2     DEFAULT GETDATE()
updated_by   NVARCHAR(50)

-- products
id           INT IDENTITY(1,1) PRIMARY KEY
品號          NVARCHAR(50)  UNIQUE NOT NULL  -- UPSERT conflict key
對照號        NVARCHAR(50)
品名          NVARCHAR(200) NOT NULL
單箱數量      INT
createtime   DATETIME2     DEFAULT GETDATE()
updated_by   NVARCHAR(50)

-- print_records
id           INT IDENTITY(1,1) PRIMARY KEY
品號          NVARCHAR(50)  NOT NULL
品名          NVARCHAR(200)                 -- snapshot at print time, no FK
列印數量      INT
createtime   DATETIME2     DEFAULT GETDATE()
username     NVARCHAR(50)
```

## Key Business Rules

### Print Label (/print)
- Required fields: 品號, 總進貨數量
- On 品號 blur/Enter/Tab: auto-fetch product (對照號, 品名, 單箱數量) via GET /api/products/:品號
- Read-only fields (對照號, 品名, 單箱數量, 總箱數) use `tabIndex=-1` to skip in keyboard navigation
- 總箱數 = `Math.floor(總進貨數量 / 單箱數量)` — read-only display
- 列印張數 = `Math.ceil(總進貨數量 / 單箱數量)`
- Last box is a 散貨箱 if `總進貨數量 % 單箱數量 !== 0`; its label shows "！！！此箱散貨箱請注意！！！"
- Date fields (製造日期 / 有效日期 / 保存期限): yyyymmdd format; any **two of three** must be filled
- After printing: POST /api/print-records to persist the record
- Label size: 11 cm x 8 cm; uses `position: absolute` (NOT `fixed`) for correct multi-page printing

### Upload (/upload)
- Accepts .xlsx / .xls
- Excel column mapping: A=品號, B=對照號, C=品名, D=單箱數量; row 1 = header (skipped)
- UPSERT via `MERGE INTO products WITH (HOLDLOCK)`
- Response returns success count and list of failed rows with reasons
- Download template button links to `/上傳範本.xlsx` served from `frontend/public/`

### Print Records (/records)
- Displays latest 500 records ordered by createtime DESC
- Client-side search by 品號, 品名, or username

### Auth
- Remember Me stores username + password to localStorage
- Register modal available on the login page
- All protected routes wrapped in `<PrivateRoute>` — 401 auto-redirects to /login

## Build for Production

```bash
# Backend
cd backend && npm run build   # tsc compiles to dist/
node dist/index.js

# Frontend
cd frontend && npm run build  # Vite outputs to dist/
# Serve dist/ with nginx or any static file host
```

## Gotchas and Known Fixes

- **MSSQL named parameters**: use `@param` syntax, never string interpolation
- **UPSERT**: use `MERGE INTO ... WITH (HOLDLOCK)` — no `ON CONFLICT` in MSSQL
- **Pagination**: use `SELECT TOP N` instead of `LIMIT N`
- **exceljs column index**: `getCell(4)` = column D (単箱数量) — do not change to 5
- **JWT_SECRET**: must be randomly generated; never use a hardcoded default
- **TabContext**: `TabProvider` must be nested inside `<BrowserRouter>` (needs useNavigate/useLocation)
- **Print labels**: `position: fixed` collapses all pages to 1 — use `position: absolute`
- **backend predev**: `fuser -k 3000/tcp` auto-clears the port to avoid EADDRINUSE
- **DB_TRUST_CERT=true**: required for local dev with a self-signed certificate; set false in production

## License

See LICENSE file.
