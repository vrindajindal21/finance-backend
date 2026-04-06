# Finance Data Processing and Access Control Backend

A clean, structured backend for a finance dashboard with Role-Based Access Control (RBAC).

**Stack:** Node.js · Express · SQLite (better-sqlite3) · JWT · Zod · bcrypt

---

## Quick Start

```bash
cd backend
npm install
node src/seed.js    # Populate demo data
node src/index.js   # Start server at http://localhost:5000
```

---

## Demo Credentials

| Role    | Email                   | Password    | Access |
|---------|-------------------------|-------------|--------|
| Admin   | admin@finance.com       | admin123    | Full CRUD + User Management |
| Analyst | analyst@finance.com     | analyst123  | View records + Summary |
| Viewer  | viewer@finance.com      | viewer123   | Dashboard summary only |

---

## API Reference

### Auth
| Method | Endpoint              | Access  | Description |
|--------|-----------------------|---------|-------------|
| POST   | `/api/auth/register`  | Public  | Register new user |
| POST   | `/api/auth/login`     | Public  | Login, receive JWT |
| GET    | `/api/auth/me`        | Auth    | Current user info |

### Financial Records
| Method | Endpoint                    | Access          | Description |
|--------|-----------------------------|-----------------|-------------|
| GET    | `/api/records/summary`      | All Auth        | Dashboard summary (income, expenses, trends) |
| GET    | `/api/records`              | Analyst + Admin | List records with filters + pagination |
| POST   | `/api/records`              | Admin           | Create new record |
| PUT    | `/api/records/:id`          | Admin           | Update a record |
| DELETE | `/api/records/:id`          | Admin           | Soft-delete a record |
| POST   | `/api/records/:id/restore`  | Admin           | Restore a soft-deleted record |

### Query Filters (GET /api/records)
| Param       | Description                    | Example |
|-------------|--------------------------------|---------|
| `type`      | Filter by INCOME or EXPENSE    | `?type=EXPENSE` |
| `category`  | Filter by category name        | `?category=Rent` |
| `start_date`| Filter from date (YYYY-MM-DD)  | `?start_date=2026-03-01` |
| `end_date`  | Filter to date                 | `?end_date=2026-03-31` |
| `q`         | Search in category or notes    | `?q=payroll` |
| `page`      | Page number (default: 1)       | `?page=2` |
| `limit`     | Records per page (default: 10) | `?limit=5` |

### Admin – User Management
| Method | Endpoint             | Access | Description |
|--------|----------------------|--------|-------------|
| GET    | `/api/admin/users`   | Admin  | List all users |
| GET    | `/api/admin/users/:id` | Admin | Get user by ID |
| PUT    | `/api/admin/users/:id` | Admin | Update role or status |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |

---

## Project Structure

```
backend/
├── src/
│   ├── index.js           # App entry: Express setup, middleware, routes
│   ├── db.js              # SQLite database init & table creation
│   ├── schemas.js         # Zod validation schemas
│   ├── utils.js           # Shared helpers (uuid, response formatting)
│   ├── seed.js            # Demo data population
│   ├── middleware/
│   │   ├── auth.js        # JWT authenticate + RBAC authorize
│   │   └── validate.js    # Zod validation middleware
│   └── routes/
│       ├── auth.js        # /api/auth
│       ├── records.js     # /api/records
│       └── admin.js       # /api/admin
├── data/
│   └── finance.db         # SQLite database (auto-created)
└── README.md
```

---

## Design Decisions & Assumptions

1. **Plain JavaScript over TypeScript** — Eliminates compilation complexity for easier evaluation setup.
2. **better-sqlite3 over Prisma/ORM** — Synchronous SQLite driver; zero config, no CLI needed, runs immediately.
3. **Soft delete** — Records are marked `is_deleted=1` rather than permanently removed, enabling restore.
4. **JWT in Authorization header** — `Bearer <token>` pattern; 24h expiry.
5. **Role hierarchy**: VIEWER → ANALYST → ADMIN, enforced at middleware level per route.
6. **Rate limiting** — 100 req/15 min per IP on `/api/*` to prevent brute-force.
7. **Pagination** — All record lists are paginated (default 10/page, max 100).
