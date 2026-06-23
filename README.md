# BlueCrest Premium Banking

React/Vite frontend with a Node.js banking API in `bluecrestback`.

## Local setup

Requirements: Node.js 20 or newer.

1. Copy `.env.example` to `.env.local`.
2. Copy `bluecrestback/.env.example` to `bluecrestback/.env`.
3. Install dependencies in both directories:
   - `npm install`
   - `cd bluecrestback && npm install`
4. Initialize the backend database:
   - `cd bluecrestback && npm run db:migrate`
5. Start the frontend and backend together from the project root:
   - `npm run dev`

The Vite development frontend runs on port 3000 and proxies API requests to `BACKEND_URL`, defaulting to `http://127.0.0.1:4000`. The local backend runs on port 4000.

Use `npm run dev:backend` only when you intentionally want to run the API
separately. The normal Vite development command starts it automatically when
port 4000 is not already serving the BlueCrest health endpoint.

Local development is SQLite-first. Keep `DB_PROVIDER=sqlite` and
`SQLITE_DB_PATH=local.db` in `bluecrestback/.env`. A stray `DATABASE_URL`
will not switch development to Railway/Postgres. For a later Railway
deployment, set `NODE_ENV=production`, `DB_PROVIDER=postgres`, and
`DATABASE_URL` in Railway.

`GET http://localhost:4000/health` reports the active database provider and
location so the selected database can be verified before changing data.

`npm run start` serves the previously generated production build. Run `npm run build` before using it.

## Verification

- Frontend type check: `npm run lint`
- Frontend production build: `npm run build`
- Backend financial-flow tests: `cd bluecrestback && npm test`
- Ledger reconciliation: `cd bluecrestback && npm run ledger:reconcile`

Ledger reconciliation is read-only. It reports mismatches and exits with a non-zero status without changing balances.
