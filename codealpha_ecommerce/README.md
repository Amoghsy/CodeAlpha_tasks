# NovaStore • Full-Stack E-Commerce Platform

<div align="center">
  <h3>A modern, responsive, full-stack e-commerce platform built for the CodeAlpha Internship.</h3>
  <p>Vanilla HTML/CSS/JS frontend connected to a robust Node.js / Express REST API backed by Supabase PostgreSQL and Supabase Auth.</p>
</div>

---

## 🌟 Overview

**NovaStore** is a complete, production-ready e-commerce web application with a separated frontend and backend architecture. The application supports user authentication with Supabase Auth, a dynamic product catalog, inventory tracking, persistent cart synchronization, promotional discount calculations, multi-step checkout, and real-time order history tracking — with all pricing and business rules calculated on the server and resilient offline fallback support.

---

## 🚀 Key Features

### 💻 Frontend (Plain HTML5, CSS3, Vanilla ES6+ JavaScript)
- **Product Catalog & Home (`index.html`)**:
  - Dynamic category pills loaded from the backend.
  - Live search filter and multi-criteria sorting (Price: Low to High, High to Low, Highest Rated, Name).
  - Clean card-based responsive layout with stock badges and quick "Add to Cart" action.
  - Interactive pagination controls.
- **Product Details View (`product.html`)**:
  - High-res image preview gallery with interactive thumbnail switcher.
  - Live inventory stock indicators (*"In Stock"*, *"Only X Left"*, *"Out of Stock"*).
  - Quantity selector with stock clamping and instant *"Buy Now"* checkout flow.
  - Related product recommendations.
- **Shopping Cart (`cart.html`)**:
  - Item listing with editable quantities, subtotals, and quick deletion.
  - Server-calculated totals (Subtotal, Discount, Estimated Tax, and Delivery Fee).
  - Promotional discount engine (`SAVE10`, `ALPHA20`, `FREESHIP`).
  - Free standard delivery progress indicator (Threshold: ₹999).
- **Checkout & Payment (`checkout.html`)**:
  - 2-Step checkout: Shipping Address form + Payment Method selection (Card or Cash on Delivery).
  - Real-time order summary sidebar with item thumbnails and total breakdown.
  - Confirmation modal displaying generated Order ID upon placement.
- **Authentication (`login.html` & `register.html`)**:
  - Token-based login and registration via Supabase Auth.
  - Password reveal toggles and 1-click demo account auto-fill.
  - Automatic `Authorization: Bearer <token>` attachment on protected requests.
- **Order History (`orders.html`)**:
  - Displays past purchases with dates, status badges (*Delivered*, *Processing*, *Shipped*), item lists, and delivery addresses.
  - 1-Click *"Buy Again"* re-ordering and print receipt functionality.

### 🛡️ Backend & Database (Express.js, Supabase PostgreSQL, RLS)
- **Centralized Business Logic**: All prices, taxes (8%), delivery fees (₹99 or free over ₹999), promo codes, and inventory deductions are evaluated on the backend.
- **Supabase Auth Integration**: User registration, password hashing, and session management via Supabase Auth.
- **Row Level Security (RLS)**: PostgreSQL policies isolate user profiles, cart items, orders, and order items.
- **Version-Controlled Migrations**: SQL migration runner with migration tracking table (`_migrations`).
- **Resilient Fallback**: If the backend server is offline or unreachable, the frontend seamlessly falls back to `mockdata.json` without breaking the user experience.

---

## 🛠️ Technology Stack

### Frontend
- **HTML5 & Vanilla JavaScript (ES6+)** — No frontend frameworks
- **Custom CSS3** — Responsive mobile-first design system, Google Fonts (*Plus Jakarta Sans* & *Inter*), smooth transitions, glassmorphism accents
- **Font Awesome 6** — Icons
- **Fetch API Client** — Centralized request handling with mock fallback

### Backend
- **Node.js & Express.js**
- **Supabase PostgreSQL** (`@supabase/supabase-js`)
- **`pg` (node-postgres)** — Migration runner
- **`zod`** — Request schema validation
- **`helmet` & `cors`** — Security & cross-origin access control
- **`morgan`** — HTTP request logging

---

## 📁 Project Structure

```text
codealpha_ecommerce/
├── Backend/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # SQL tables, relations & RLS policies
│   ├── seeds/
│   │   └── seed_products.sql       # Starter catalog in Indian Rupees (₹)
│   ├── scripts/
│   │   ├── migrate.js              # Migration engine (npm run db:migrate)
│   │   └── seed.js                 # Catalog seeder (npm run db:seed)
│   ├── src/
│   │   ├── config/
│   │   │   └── supabaseClient.js   # Supabase client setup
│   │   ├── controllers/
│   │   │   ├── auth.controller.js  # Register, login, logout, me
│   │   │   ├── products.controller.js # Catalog, search, categories
│   │   │   ├── cart.controller.js  # Cart management & pricing calculation
│   │   │   └── orders.controller.js # Order creation & history
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js  # JWT Bearer verification
│   │   │   ├── error.middleware.js # Centralized 404 & 500 error handlers
│   │   │   └── validate.middleware.js # Zod validation middleware
│   │   ├── routes/
│   │   │   ├── auth.routes.js      # /api/auth
│   │   │   ├── products.routes.js  # /api/products
│   │   │   ├── cart.routes.js      # /api/cart
│   │   │   └── orders.routes.js    # /api/orders
│   │   └── server.js               # Express application entry point
│   ├── .env.example
│   └── package.json
│
└── Frontend/
    ├── css/
    │   └── styles.css              # Universal design system & responsiveness
    ├── data/
    │   └── mockdata.json           # Catalog & offline store rules in ₹
    ├── js/
    │   ├── constants.js            # Network URLs & storage keys
    │   ├── api.js                  # Centralized API fetch wrapper & fallback
    │   ├── auth.js                 # User auth state & session handlers
    │   ├── cart.js                 # Cart state & backend calculation dispatcher
    │   └── main.js                 # Shared navbar, toasts & helper utilities
    ├── index.html                  # Product listing & search
    ├── product.html                # Product detail view
    ├── cart.html                   # Cart & promo calculator
    ├── checkout.html               # Shipping & order payment
    ├── login.html                  # Sign in page
    ├── register.html               # Sign up page
    └── orders.html                 # Order history & receipts
```

---

## 🗄️ Database Schema & RLS Policies

The database is built on PostgreSQL inside Supabase:

| Table | Primary Key | Foreign Keys | Description |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `id (UUID)` | `auth.users(id)` | User profile details (full name, phone, address) |
| `public.products` | `id (UUID)` | — | Product catalog, pricing in ₹, category, and inventory stock |
| `public.orders` | `id (UUID)` | `profiles(id)` | Orders with status, total in ₹, and shipping JSON |
| `public.order_items`| `id (UUID)` | `orders(id)`, `products(id)` | Individual items purchased in an order |
| `public.cart_items` | `id (UUID)` | `profiles(id)`, `products(id)` | User's active shopping cart items |

---

## ⚡ Setup & Execution Guide

### 1. Configure Environment Variables
Inside `codealpha_ecommerce/Backend`, create `.env` from `.env.example`:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*

# Supabase REST & Auth Keys (Supabase Dashboard ➔ Project Settings ➔ API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Direct Postgres URL (Supabase Dashboard ➔ Project Settings ➔ Database ➔ URI)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

### 2. Run Database Migration & Seed Data
```powershell
cd "d:\My Work\Internships\codealpha\codealpha_ecommerce\Backend"

# Install backend dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed product catalog in Indian Rupees (₹)
npm run db:seed
```

### 3. Start the Backend API Server
```powershell
npm run dev
```
- API Base URL: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

### 4. Run the Frontend
Open `codealpha_ecommerce/Frontend` with any static server:
- **VS Code Live Server**: Right-click `Frontend/index.html` ➔ **Open with Live Server**.
- Or via terminal:
  ```powershell
  npx serve "d:\My Work\Internships\codealpha\codealpha_ecommerce\Frontend"
  ```

---

## 📚 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user and initialize profile
- `POST /api/auth/login` — Sign in and receive JWT token
- `POST /api/auth/logout` — End user session
- `GET /api/auth/me` *(Protected)* — Get current user profile

### 📦 Products (`/api/products`)
- `GET /api/products` — List products with filters: `?category=`, `?search=`, `?sort=`, `?page=`, `?limit=`
- `GET /api/products/categories` — Get active product categories
- `GET /api/products/:id` — Get single product details

### 🛒 Cart (`/api/cart`)
- `POST /api/cart/calculate` — Calculate cart subtotal, tax, shipping, discount, and total
- `GET /api/cart` *(Protected)* — Fetch user's cart items
- `POST /api/cart` *(Protected)* — Add item with stock validation
- `PUT /api/cart/:itemId` *(Protected)* — Update item quantity
- `DELETE /api/cart/:itemId` *(Protected)* — Remove item
- `POST /api/cart/sync` *(Protected)* — Sync guest cart to account

### 📋 Orders (`/api/orders` - *Protected*)
- `POST /api/orders` — Create order, decrement stock, and clear cart
- `GET /api/orders` — List user's past orders with items
- `GET /api/orders/:id` — Get single order details
