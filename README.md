# 標籤列印系統 (Label Web)

## 專案概述
商品標籤列印管理系統，支援使用者登入驗證、商品主檔上傳、標籤列印與列印記錄查詢。

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + React Router + Axios
- Backend: Node.js + Fastify + TypeScript
- Database: PostgreSQL
- 套件: bcrypt (hash)、jsonwebtoken (JWT)、exceljs (Excel 解析)、pg (PostgreSQL)

## 目錄結構
```
label_web/
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   ├── skills/          # db-schema / print-label / upload-product / auth
│   └── commands/        # new-feature / db-migrate
├── backend/
│   ├── src/
│   │   ├── index.ts              # Fastify 主程式
│   │   ├── db/pool.ts            # PostgreSQL 連線池
│   │   ├── middleware/auth.ts    # JWT 驗證 middleware
│   │   ├── routes/
│   │   │   ├── auth.ts           # POST /api/auth/login
│   │   │   ├── products.ts       # GET /api/products/:品號, POST /api/products/batch
│   │   │   └── printRecords.ts   # GET/POST /api/print-records
│   │   └── utils/dateValidation.ts
│   ├── .env                      # 實際環境變數 (勿 commit)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # client.ts / auth.ts / products.ts / printRecords.ts
│   │   ├── components/   # Navbar.tsx / PrivateRoute.tsx
│   │   ├── pages/        # LoginPage / IndexPage / PrintLabelPage / UploadPage / PrintRecordsPage
│   │   └── utils/date.ts
│   ├── .env.example
│   └── package.json
├── database/
│   └── migrations/
│       └── 20260312_create_tables.sql
└── scripts/sec.sh
```

## Architecture (系統架構)

### 頁面路由
```
/login   → LoginPage.tsx    (公開)
/        → IndexPage.tsx    (需登入)
/print   → PrintLabelPage.tsx
/upload  → UploadPage.tsx
/records → PrintRecordsPage.tsx
```

### 驗證流程
```
LoginPage → POST /api/auth/login
    → bcrypt.compare (pg rowCount null 安全判斷)
    → JWT token → localStorage
    → PrivateRoute 守衛所有受保護頁面
    → 401 自動跳回 /login
```

### 資料庫 Schema (PostgreSQL)
```sql
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  username     VARCHAR(50) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,   -- bcrypt hashed, SALT_ROUNDS=12
  createtime   TIMESTAMPTZ DEFAULT NOW(),
  updated_by   VARCHAR(50)
);

CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  品號          VARCHAR(50) NOT NULL UNIQUE,  -- UPSERT 衝突鍵
  對照號        VARCHAR(50),
  品名          VARCHAR(200) NOT NULL,
  單箱數量      INT,
  createtime   TIMESTAMPTZ DEFAULT NOW(),
  updated_by   VARCHAR(50)
);

CREATE TABLE print_records (
  id           SERIAL PRIMARY KEY,
  品號          VARCHAR(50) NOT NULL,
  品名          VARCHAR(200),   -- 列印當下快照，不做外鍵
  列印數量      INT,
  createtime   TIMESTAMPTZ DEFAULT NOW(),
  username     VARCHAR(50)
);
```

## Commands
```bash
# 後端開發
cd backend && npm run dev     # nodemon + ts-node, port 3000
cd backend && npm run build   # tsc → dist/

# 前端開發
cd frontend && npm run dev    # Vite, port 5173
cd frontend && npm run build  # 輸出 dist/

# 建立管理員帳號 hash
node -e "require('bcrypt').hash('密碼', 12).then(console.log)"
```

## 重要業務規則

### PrintLabelPage (/print)
- 必填: 品號、總進貨數量
- 品號失焦 → 自動 GET /api/products/:品號 帶入對照號/品名/單箱數量
- 總箱數 = Math.floor(總進貨數量 / 單箱數量)，唯讀欄位
- 日期欄位 (製造/有效/保存): yyyymmdd，isValidYYYYMMDD 驗證
- 列印後 POST /api/print-records 寫入記錄

### UploadPage (/upload)
- 接受 .xlsx / .xls
- Excel 欄位: A=品號, B=對照號, C=品名, E=單箱數量 (第一列為標題)
- UPSERT ON CONFLICT (品號)，回傳成功/失敗筆數

### PrintRecordsPage (/records)
- GET /api/print-records，最新 500 筆
- 前端搜尋: 品號 / 品名 / 帳號

### LoginPage (/login)
- Remember Me 同時儲存帳號與密碼至 localStorage
- 左右分割設計: 左側紫色漸層 + 右側白色表單

## Gotchas & Known Fixes
- **pg v8 rowCount null bug**: SELECT 查詢的 rowCount 型別為 `number | null`
  → 判斷須用 `!result.rowCount || result.rowCount === 0`
- xlsx 套件有安全漏洞 → 改用 **exceljs**
- JWT_SECRET 不可使用預設值，需隨機產生: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- .env 必須放在 backend/ 目錄下，不是專案根目錄

## Workflows

### 新增功能
1. 讀取相關頁面 tsx
2. 確認 DB schema 是否需要異動
3. 後端: route → DB query
4. 前端: api/ → page
5. TypeScript 編譯確認 (tsc --noEmit)

### 修改資料庫
1. 更新 CLAUDE.md schema 區塊
2. 建立 database/migrations/YYYYMMDD_xxx.sql
3. 更新 API 與前端欄位
