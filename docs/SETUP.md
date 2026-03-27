# HRMS Backend Setup

## 1) Environment

Copy `.env.example` to `.env` and fill values.

Required keys:
- `PORT`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCK_MS`
- `CORS_ORIGINS`

## 2) Install

```bash
npm install
```

## 3) Migrate and Seed

```bash
npm run migrate
npm run seed
```

Default seeded credentials:
- Admin: `admin@example.com` / `Admin@123`
- Employee: `employee@example.com` / `Admin@123`

## 4) Run

```bash
npm run dev
```

## 5) CORS

Frontend origin must be in `CORS_ORIGINS`.

Example:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

If CORS blocks requests, verify that browser origin exactly matches one of the configured origins (protocol + host + port).
