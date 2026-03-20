# Skill: auth

## Description

Handles all authentication and authorisation concerns: login, user registration,
JWT issuance and verification, the JWT middleware that protects routes, and the
frontend login page (Remember Me, Register modal, 401 redirect).

## Trigger

Use this skill when the user asks about or requests changes to:
- Login or registration logic
- JWT token generation, expiry, or verification
- bcrypt hashing or salt round configuration
- The JWT middleware (`middleware/auth.ts`) that protects backend routes
- The `LoginPage.tsx` UI (form layout, Remember Me, Register modal)
- PrivateRoute / 401 auto-redirect behaviour on the frontend
- POST /api/auth/login or POST /api/auth/register endpoints

## Files to Read

Always read these files before making changes:

1. `backend/src/routes/auth.ts` — login and register route handlers
2. `backend/src/middleware/auth.ts` — JWT verification middleware (fastify preHandler)
3. `backend/src/db/pool.ts` — MSSQL connection pool (for query patterns)
4. `frontend/src/pages/LoginPage.tsx` — login UI + register modal
5. `frontend/src/api/auth.ts` — `login()` and `register()` API functions
6. `frontend/src/api/client.ts` — axios instance (401 interceptor, JWT header)
7. `frontend/src/components/PrivateRoute.tsx` — route guard component

## Steps

### Login (POST /api/auth/login)

1. **Read** `backend/src/routes/auth.ts` and `backend/src/db/pool.ts`.
2. Query: `SELECT id, username, password FROM users WHERE username = @username`
   - If no row returned, respond 401 immediately (do not call bcrypt).
3. `bcrypt.compare(requestPassword, row.password)` — if false, respond 401.
4. Sign JWT: `jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '8h' })`
5. Return `{ token }` with status 200.

### Register (POST /api/auth/register)

1. Check for duplicate: `SELECT 1 FROM users WHERE username = @username`
   - If row exists, return 409 Conflict.
2. Hash: `bcrypt.hash(password, Number(process.env.SALT_ROUNDS ?? 12))`
3. Insert: `INSERT INTO users (username, password) VALUES (@username, @hash)`
4. Return 201 Created `{ message: 'User created' }`.

### JWT Middleware (`middleware/auth.ts`)

- Registered as a Fastify `preHandler` on all routes except `/api/auth/*`
- Extract token from `Authorization: Bearer <token>` header
- `jwt.verify(token, JWT_SECRET)` — on error respond 401
- Attach decoded payload to `request.user`

### Frontend — LoginPage

- Left panel: purple gradient (`linear-gradient`) branding area
- Right panel: white login form
- "Remember Me": on login success, save `username` and `password` to `localStorage`;
  on page load, read and pre-fill the fields if present
- "Register" button opens an inline modal (same page, no route change)
- Register modal calls `register()` from `src/api/auth.ts`; on success auto-fills
  the login form with the new credentials

### Frontend — PrivateRoute

- Reads JWT token from `localStorage`
- If absent, `<Navigate to="/login" replace />`
- Wraps all protected routes in `App.tsx`

### Frontend — 401 Interceptor (`client.ts`)

- Axios response interceptor: if `error.response.status === 401`, clear token from
  `localStorage` and `window.location.replace('/login')`

## Validation Checklist

- [ ] Login: user-not-found and wrong-password both return 401 (same message to avoid enumeration)
- [ ] bcrypt.compare is called only when a user row is found
- [ ] JWT signed with `JWT_SECRET` from env — no hardcoded secret
- [ ] JWT expiry is set (e.g. `8h`) — do not omit `expiresIn`
- [ ] SALT_ROUNDS read from env with a numeric fallback of 12
- [ ] Register checks for duplicate username before hashing
- [ ] JWT middleware protects all routes except `/api/auth/*`
- [ ] `request.user` is typed correctly in Fastify's type augmentation
- [ ] Remember Me saves and restores both username and password
- [ ] 401 response from any API call clears localStorage and redirects to /login
- [ ] `tsc --noEmit` reports zero errors in both frontend and backend

## Output

After completing changes, report:
- Which files were modified
- Change summary (new endpoint, modified middleware, UI update, etc.)
- Result of `tsc --noEmit` for both frontend and backend
- Any security considerations addressed (e.g. timing attacks, token expiry)
