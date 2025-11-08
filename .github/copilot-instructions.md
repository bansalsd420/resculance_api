## Quick, actionable context for AI code contributors

This file provides the minimal, concrete information an AI coding agent needs to be productive in this repository.

1) Project overview
- Backend: Node.js + Express (entry: `src/server.js`). Main responsibilities: REST API, auth (JWT), Socket.IO real-time events, migrations and seeding.
- Database: MySQL (connection in `src/config/database.js`). Migration scripts live under `src/database/*` and are invoked with `npm run migrate` / `npm run seed`.
- Frontend: React + Vite in `frontend/` (dev: `cd frontend && npm run dev`).

2) Important commands (run from repository root)
- Dev backend: `npm run dev` (uses `nodemon src/server.js`).
- Start backend: `npm start` (production `node src/server.js`).
- DB: `npm run migrate`, `npm run seed`, `npm run db:setup` (resets + migrate + seed).
- Frontend dev: `cd frontend && npm run dev`. Frontend build: `cd frontend && npm run build`.

3) Required environment variables (checked at startup)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — server exits if missing.
- `PORT` (defaults to 5000), `API_VERSION` (defaults to `v1`), `CORS_ORIGIN` / `SOCKET_CORS_ORIGIN` (comma-separated origins for CORS).
- Use `cp .env.example .env` and edit values before running.

4) Architecture / code layout highlights (where to look)
- `src/controllers/` — route handlers. Follow existing controller pattern (receive req, call services/models, return JSON).
- `src/routes/` — route wiring. New endpoints should be registered here with matching controllers and validation middleware.
- `src/models/` — DB model wrappers used throughout. Naming: singular, PascalCase (e.g. `User.js`).
- `src/middleware/` — auth, validation, error handling. Error middleware (`errorHandler`) must remain last in pipeline.
- `src/socket/` — Socket.IO handlers. Socket init is in `src/server.js` where `socketHandler(io)` is called and `io` is stored on the app (`app.set('io', io)`).
- `src/config/constants.js` — canonical constants (roles, organization types, socket event names). Prefer these constants over string literals.

5) Conventions and patterns specific to this repo
- Role & org enums: use `ROLES` and `ORG_TYPES` from `src/config/constants.js` instead of new string literals to avoid subtle mismatches.
- API base: routes are mounted at `/api/${process.env.API_VERSION || 'v1'}`. Keep versioning in mind when adding routes or documentation.
- DB setup: the server attempts to detect the `users` table and will auto-run migrations on first start, but preferred developer flow is to run `npm run db:setup` locally.
- Rate limiting is present in code but commented out — do not assume it's active unless `rateLimit` is enabled and configured.

6) Socket.IO usage examples (concrete)
- Socket events constants: check `SOCKET_EVENTS` in `src/config/constants.js`.
- Emit from an Express route/controller: `const io = req.app.get('io'); io.to(room).emit(constants.SOCKET_EVENTS.LOCATION_UPDATE, payload);`
- The socket handler lives at `src/socket/socketHandler.js` — follow its room naming and join/leave semantics when emitting.

7) Quick code-change checklist
- Add route -> implement controller in `src/controllers` -> add validator/middleware in `src/middleware` as needed -> register route in `src/routes/*` -> add tests or a manual curl example in PR description.
- When touching auth/roles, update `src/config/constants.js` if adding new enums and audit codepaths that check role strings.

8) Integration points & external deps to be mindful of
- MySQL (via `mysql2`) — migrations and seeders live under `src/database/`.
- Socket.IO clients (frontend at `frontend/src`) expect socket events listed in constants; renaming events requires coordinating client changes.
- JWT tokens + refresh flow is used everywhere — changing token structure requires updates to frontend auth store (`frontend/src/store/authStore.js`) and API interceptors (`frontend/src/services/api.js`).

9) Useful files to reference while coding
- `src/server.js` — app bootstrap, migrations auto-run check, IO wiring.
- `src/config/constants.js` — roles, statuses, socket event names.
- `src/database/migrate-all.js` and `src/database/seed-all.js` — DB schema and seed data (superadmin creds are seeded here).
- `frontend/README.md` and `frontend/src/services/api.js` — how frontend calls the API and handles tokens.

10) PR & commit guidance for AI agents
- Keep changes small and focused. Update `README.md` or `frontend/README.md` only when adding new developer-facing commands.
- When adding socket events or changing constants, include a short migration note and update the constants file.
- If adding DB columns, include migration script under `src/database/` and add a seeder if new reference data is required.

If any of these areas are unclear or you'd like the file to include more examples (emitting a specific socket event, a sample migration, or sample request/response), tell me which one and I will iterate.
