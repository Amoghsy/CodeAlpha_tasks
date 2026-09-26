# NovaStore E-Commerce Backend REST API

A scalable, secure Node.js & Express.js REST API backend for the NovaStore e-commerce platform, integrated with **Supabase (PostgreSQL Database, Auth, and Row Level Security)**.

---

## 🛠️ CLI Database Commands

| Command | Action |
| :--- | :--- |
| `npm run db:migrate` | Runs all pending `.sql` migrations in `migrations/` against PostgreSQL |
| `npm run db:seed` | Populates the catalog with starter products using Supabase client |
| `npm run dev` | Starts Express server with live reload |

---

## 📁 Project Structure

```text
Backend/
├── migrations/
│   └── 001_initial_schema.sql  # Database tables, relations & RLS policies
├── seeds/
│   └── seed_products.sql       # SQL product catalog seed
├── scripts/
│   ├── migrate.js              # Migration engine (npm run db:migrate)
│   └── seed.js                 # Seed runner (npm run db:seed)
├── src/
│   ├── config/
│   │   └── supabaseClient.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── server.js
└── package.json
```

---

## ⚡ How to Migrate & Seed the Database

### 1. Configure `.env`
Ensure your `Backend/.env` file contains your direct Postgres `DATABASE_URL` for migration:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key

# Get this from Supabase Dashboard ➔ Project Settings ➔ Database ➔ Connection string (URI)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

### 2. Run Database Migration
```powershell
npm run db:migrate
```
*(Or alias: `npm run migrate`)*

### 3. Seed Starter Catalog Data
```powershell
npm run db:seed
```
*(Or alias: `npm run seed`)*

### 4. Start the Backend API
```powershell
npm run dev
```
Server runs on `http://localhost:5000/api`
