# Rapido-Style Delivery Platform

This project now supports three separate journeys:

- `Customer`: register, login, book deliveries, view delivery history
- `Partner`: self-register, add vehicle details, wait for admin approval, manage jobs
- `Admin`: login, approve or reject partners, assign deliveries, monitor all history

## Important database note

The new schema is different from the previous partner model. Use a fresh database or rerun the schema from scratch.

Recommended:

1. Drop the old `rapido_delivery` database if it contains the previous schema.
2. Create a fresh `rapido_delivery` database.
3. Run `backend/sql/schema.sql`.
4. Run `backend/sql/seed.sql`.

## Seeded login

Only admin is pre-seeded:

- Phone: `9000000000`
- Password: `admin123`

Partners are **not** pre-created anymore.
Customers are **not** pre-created anymore.

## Backend env

Create `backend/.env` using `backend/.env.example`.

Example:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapido_delivery
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

## Run locally

Install dependencies:

```bash
npm.cmd run install:all
```

Start backend:

```bash
npm.cmd run dev:backend
```

Start frontend in another terminal:

```bash
npm.cmd run dev:frontend
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:4000`

## Key files

- `backend/sql/schema.sql`
- `backend/sql/seed.sql`
- `backend/src/db.js`
- `backend/src/repository.js`
- `backend/src/server.js`
- `frontend/src/App.jsx`
