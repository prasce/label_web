# Frontend — 標籤列印系統

React 18 + TypeScript + Vite single-page application for the Label Web label printing system.

## Tech Stack

| Technology    | Version / Notes                              |
|---------------|----------------------------------------------|
| React         | 18 — functional components + hooks           |
| TypeScript    | Strict mode                                  |
| Vite          | Dev server on port 5173, HMR                 |
| React Router  | v6 — declarative routing + PrivateRoute      |
| Axios         | HTTP client with centralized interceptors    |
| CSS           | Plain CSS modules / inline styles            |

## Pages and Routes

| Route      | Component             | Auth Required | Description                         |
|------------|-----------------------|---------------|-------------------------------------|
| /login     | LoginPage.tsx         | No            | Login form with Remember Me + Register modal |
| /          | IndexPage.tsx         | Yes           | Dashboard / home                    |
| /print     | PrintLabelPage.tsx    | Yes           | Fill in product info, preview and print labels |
| /upload    | UploadPage.tsx        | Yes           | Upload Excel file to batch-upsert products |
| /records   | PrintRecordsPage.tsx  | Yes           | Browse and search print history     |

All authenticated routes are guarded by `<PrivateRoute>` in `src/components/PrivateRoute.tsx`.
A 401 response from the API automatically redirects to `/login`.

### LoginPage
- Left panel: purple gradient branding
- Right panel: login form
- "Remember Me" stores username and password to `localStorage`
- Register modal opens inline — no separate route

### PrintLabelPage
- 品號 blur/Enter/Tab triggers `GET /api/products/:品號` to auto-fill 對照號, 品名, 單箱數量
- Read-only fields (對照號, 品名, 單箱數量, 總箱數) have `tabIndex=-1`
- Keyboard navigation order: 品號 -> 總進貨數量 -> 製造日期 -> 有效日期 -> 保存期限
- 總箱數 = `Math.floor(總進貨數量 / 單箱數量)` displayed read-only
- Date validation via `src/utils/date.ts` — yyyymmdd format, any two of three required
- Label size 11 cm x 8 cm, printed using `position: absolute` (not `fixed`)
- Scatter box (散貨箱) warning banner on the last label when remainder > 0
- After print: `POST /api/print-records` persists the event

### UploadPage
- Drag-and-drop or file picker for `.xlsx` / `.xls`
- Calls `POST /api/products/batch` with `multipart/form-data`
- Displays success count and failed rows returned by the API
- "下載上傳範本" button fetches `/上傳範本.xlsx` from `public/`

### PrintRecordsPage
- Loads latest 500 records from `GET /api/print-records`
- Client-side filter by 品號, 品名, or username (no extra API calls)

## State Management

### TabContext (`src/contexts/TabContext.tsx`)

Manages the browser-tab-like navigation bar shown in the header.

```
TabProvider (must be inside <BrowserRouter>)
  |- tabs: Tab[]            — currently open tabs
  |- openTab(path, label)  — open or focus a tab; calls navigate(path)
  +- closeTab(path)        — close a tab; navigates to previous or home
```

PATH_LABELS mapping:

| Path      | Label         |
|-----------|---------------|
| /         | 首頁           |
| /print    | 標籤列印       |
| /upload   | 商品上傳       |
| /records  | 列印記錄       |

**Important**: `TabProvider` must be placed _inside_ `<BrowserRouter>` because it calls
`useNavigate` and `useLocation` internally.

### Navbar (`src/components/Navbar.tsx`)

Calls `openTab(path, label)` on click — does NOT use `<Link>` directly.
This ensures the tab state stays in sync with the active route.

## API Layer (`src/api/`)

| File              | Exports                               | Notes                              |
|-------------------|---------------------------------------|------------------------------------|
| client.ts         | axios instance                        | Reads `VITE_API_URL`; attaches JWT from localStorage; handles 401 redirect |
| auth.ts           | `login()`, `register()`               | POST /api/auth/login, /register    |
| products.ts       | `getProduct()`, `batchUpload()`       | GET /api/products/:品號, POST /api/products/batch |
| printRecords.ts   | `getPrintRecords()`, `createRecord()` | GET / POST /api/print-records      |

All API functions are typed with TypeScript interfaces. The axios instance in `client.ts`
automatically injects the `Authorization: Bearer <token>` header from `localStorage` and
redirects to `/login` on a 401 response.

## Components (`src/components/`)

| Component        | Description                                                     |
|------------------|-----------------------------------------------------------------|
| Navbar.tsx       | Top navigation bar; calls `openTab()` for route changes         |
| TabBar.tsx       | Horizontal tab strip; x button closes tab, click activates it   |
| PrivateRoute.tsx | Wraps protected routes; redirects unauthenticated users to /login|

## Utilities (`src/utils/`)

### date.ts
- `isValidYYYYMMDD(str: string): boolean` — validates yyyymmdd format (checks month/day ranges)
- `formatDateDisplay(str: string): string` — converts yyyymmdd to yyyy/mm/dd for display

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type-check without emitting
npx tsc --noEmit

# Build for production (output to dist/)
npm run build

# Preview production build locally
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` before running:

```bash
cp .env.example .env
```

| Variable       | Description                          | Example                    |
|----------------|--------------------------------------|----------------------------|
| VITE_API_URL   | Backend API base URL                 | http://localhost:3000      |

All `VITE_` prefixed variables are embedded at build time by Vite and are visible in the
browser bundle — never put secrets here.

## Project Structure

```
frontend/
|- public/
|   +- 上傳範本.xlsx        # Served as a static download
|- src/
|   |- api/
|   |   |- client.ts
|   |   |- auth.ts
|   |   |- products.ts
|   |   +- printRecords.ts
|   |- components/
|   |   |- Navbar.tsx
|   |   |- PrivateRoute.tsx
|   |   +- TabBar.tsx
|   |- contexts/
|   |   +- TabContext.tsx
|   |- pages/
|   |   |- LoginPage.tsx
|   |   |- IndexPage.tsx
|   |   |- PrintLabelPage.tsx
|   |   |- UploadPage.tsx
|   |   +- PrintRecordsPage.tsx
|   |- utils/
|   |   +- date.ts
|   |- App.tsx
|   +- main.tsx
|- .env.example
|- index.html
|- package.json
|- tsconfig.json
+- vite.config.ts
```

## Key Notes

- `position: absolute` (not `fixed`) must be used for label containers to ensure each label
  prints on its own page without collapsing into a single page.
- `TabProvider` must be placed inside `<BrowserRouter>` — placing it outside will throw a
  "useNavigate may be used only in the context of a Router" error.
- The download template button links to `/上傳範本.xlsx` — Vite serves everything in `public/`
  at the root path automatically during both dev and production builds.
