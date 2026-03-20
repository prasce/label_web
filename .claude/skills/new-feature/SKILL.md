# Skill: new-feature

## Description

Step-by-step workflow for adding a new page and its supporting backend route to the
Label Web application. Follow these steps in order to keep the frontend routing,
tab navigation, API layer, and backend in sync.

## Trigger

Use this skill when the user asks to:
- Add a new page to the application
- Add a new tab to the navigation bar
- Scaffold a new backend route from scratch
- Wire up a new frontend page end-to-end (page -> API -> backend -> DB)

## Files to Read

Read these files before starting — they provide the patterns to follow:

1. `frontend/src/App.tsx` — route declarations (where to add the new route)
2. `frontend/src/contexts/TabContext.tsx` — PATH_LABELS map and openTab/closeTab
3. `frontend/src/components/Navbar.tsx` — how existing nav links call openTab()
4. `frontend/src/components/TabBar.tsx` — tab bar UI (no changes usually needed)
5. `frontend/src/components/PrivateRoute.tsx` — wrapping protected routes
6. `frontend/src/api/client.ts` — axios instance (follow the same import pattern)
7. `backend/src/index.ts` — where routes are registered with Fastify
8. An existing page (e.g. `frontend/src/pages/PrintLabelPage.tsx`) — for code style

## Steps

### Step 1 — Create the Frontend Page

Create `frontend/src/pages/<FeatureName>Page.tsx`.

```tsx
// Minimal skeleton
import React from 'react';

const FeatureNamePage: React.FC = () => {
  return (
    <div>
      <h1>Feature Name</h1>
    </div>
  );
};

export default FeatureNamePage;
```

### Step 2 — Add the Route in App.tsx

In `frontend/src/App.tsx`, add a `<Route>` inside the existing protected route group:

```tsx
<Route
  path="/new-path"
  element={
    <PrivateRoute>
      <FeatureNamePage />
    </PrivateRoute>
  }
/>
```

### Step 3 — Register the Tab in TabContext.tsx

In `frontend/src/contexts/TabContext.tsx`, add an entry to the `PATH_LABELS` map:

```ts
const PATH_LABELS: Record<string, string> = {
  '/':           '首頁',
  '/print':      '標籤列印',
  '/upload':     '商品上傳',
  '/records':    '列印記錄',
  '/new-path':   '新功能名稱',   // <-- add this line
};
```

### Step 4 — Add the Navbar Link

In `frontend/src/components/Navbar.tsx`, add a navigation item that calls `openTab`:

```tsx
<button onClick={() => openTab('/new-path', '新功能名稱')}>
  新功能名稱
</button>
```

Do NOT use a `<Link to="...">` directly — always go through `openTab()`.

### Step 5 — Create the Backend Route

Create `backend/src/routes/<featureName>.ts`.

```ts
import { FastifyInstance } from 'fastify';
import pool from '../db/pool';

export default async function featureNameRoutes(fastify: FastifyInstance) {
  fastify.get('/api/feature-name', async (request, reply) => {
    const result = await pool.request()
      .query('SELECT TOP 500 * FROM some_table ORDER BY createtime DESC');
    return reply.send(result.recordset);
  });
}
```

Follow these conventions:
- Use MSSQL named parameters (`@param`) — never string interpolation
- Use `SELECT TOP N` instead of `LIMIT N`
- Import and use `pool` from `../db/pool`

### Step 6 — Register the Route in index.ts

In `backend/src/index.ts`, import and register the new route:

```ts
import featureNameRoutes from './routes/featureName';

// Inside the Fastify setup block:
fastify.register(featureNameRoutes);
```

### Step 7 — Add the Frontend API Function

Create or extend a file in `frontend/src/api/` (e.g. `featureName.ts`):

```ts
import client from './client';

export interface FeatureItem {
  id: number;
  // ... other typed fields
}

export const getFeatureItems = async (): Promise<FeatureItem[]> => {
  const { data } = await client.get<FeatureItem[]>('/api/feature-name');
  return data;
};
```

Import and use this function in the page component created in Step 1.

### Step 8 — Type-check

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

Fix all reported errors before considering the feature complete.

## Validation Checklist

- [ ] Page file created in `frontend/src/pages/`
- [ ] Route added to `App.tsx` wrapped in `<PrivateRoute>`
- [ ] PATH_LABELS entry added in `TabContext.tsx`
- [ ] Navbar calls `openTab('/new-path', 'label')` — no bare `<Link>` for nav items
- [ ] Backend route file created in `backend/src/routes/`
- [ ] Backend route registered in `backend/src/index.ts`
- [ ] Frontend API function created with proper TypeScript interface
- [ ] API function imported and called in the page component
- [ ] SQL uses `@param` named parameters; no string interpolation
- [ ] SQL uses `SELECT TOP N` not `LIMIT N`
- [ ] `tsc --noEmit` passes in both frontend and backend

## Output

After completing the new feature, report:
- All files created and modified (with absolute paths)
- The new route path and tab label
- Backend endpoint(s) added
- Result of `tsc --noEmit` for both packages
- Any DB schema changes required (and whether db-schema skill was used)
