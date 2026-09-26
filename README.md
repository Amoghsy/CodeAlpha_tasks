# CodeAlpha Internship Tasks & Projects

<div align="center">
  <h3>Repository for full-stack web development internship projects developed for <strong>CodeAlpha</strong>.</h3>
  <p>Built using modern web standards, Node.js & Express.js REST APIs, PostgreSQL, Supabase Database & Auth, and responsive frontends.</p>
</div>

---

## 📂 Projects Directory

```text
codealpha/
├── codealpha_ecommerce/       # Project 1: NovaStore Full-Stack E-Commerce Platform
│   ├── Backend/               # Express.js REST API + Supabase PostgreSQL + Auth
│   ├── Frontend/              # Vanilla HTML5 / CSS3 / ES6+ JavaScript Frontend
│   └── README.md              # Detailed E-Commerce Documentation
│
├── codealpha_socialmedia/     # Project 2: Vibesta Full-Stack Social Media Platform
│   ├── Backend/               # Express.js REST API + PostgreSQL + JWT
│   ├── Frontend/              # Vanilla JS + Tailwind CSS Frontend
│   └── README.md              # Detailed Social Media Documentation
│
└── README.md                  # Workspace Master Index
```

---

## 🌟 Project 1: NovaStore • E-Commerce Platform

> 📖 **[Read Full Project Documentation →](./codealpha_ecommerce/README.md)**

A high-performance, full-stack e-commerce web application with server-side business logic and full Indian Rupee (₹) pricing.

### Key Highlights:
- **7 Responsive Views**: Product Listing, Product Details, Shopping Cart, 2-Step Checkout, Customer Login, Registration, and Order History with Receipts.
- **Supabase PostgreSQL Database**: Version-controlled migrations (`001_initial_schema.sql`), Row Level Security (RLS), and database seeder.
- **Supabase Auth**: Secure user registration, JWT login, and session persistence.
- **Server-Side Pricing Engine**: Subtotal, taxes (8%), delivery fees (free over ₹999), promo codes (`SAVE10`, `ALPHA20`, `FREESHIP`), and stock deductions computed by the backend.
- **Resilient Offline Fallback**: Automatic failover to `mockdata.json` if the backend is offline.

### Tech Stack:
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Custom CSS3 (Plus Jakarta Sans & Inter)
- **Backend**: Node.js, Express.js, `@supabase/supabase-js`, `pg`, `zod`, `helmet`, `cors`

---

## 🌟 Project 2: Vibesta • Social Media Platform

> 📖 **[Read Full Project Documentation →](./codealpha_socialmedia/README.md)**

A full-stack Instagram-style social media platform featuring posts, stories, real-time engagement, and profile management.

### Key Highlights:
- **Interactive Feed**: Personalized posts combining followed accounts, double-tap to like with heart animation, and inline comments.
- **Stories System**: Instagram-style circular story rings with multi-segment timer viewer.
- **User Profiles & Follow System**: 3-column responsive post grid, live follower/following counters, and editable profiles.
- **Media Handling & Post Creation**: Local file uploads, Unsplash integration, aspect ratio toggles, and hashtag support.
- **Database & Auth**: Custom JWT authentication with bcrypt password hashing and PostgreSQL persistence on Supabase.

### Tech Stack:
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Tailwind CSS, Custom CSS
- **Backend**: Node.js, Express.js, PostgreSQL (Supabase), `jsonwebtoken`, `bcryptjs`, `multer`

---

## 🚀 Quick Start Guide

### NovaStore (E-Commerce)
```powershell
# 1. Start Backend Server
cd "codealpha_ecommerce/Backend"
npm install
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed product catalog in ₹
npm run dev          # Runs on http://localhost:5000

# 2. Run Frontend
# Open codealpha_ecommerce/Frontend/index.html in browser or Live Server
```

### Vibesta (Social Media)
```powershell
# 1. Start Backend Server
cd "codealpha_socialmedia/Backend"
npm install
npm run migrate      # Run database migrations
npm run seed         # Seed demo users & posts
npm run dev          # Runs on http://localhost:5000

# 2. Run Frontend
# Open codealpha_socialmedia/Frontend/pages/index.html in browser or Live Server
```

---

## 📜 License & Acknowledgments

Developed by **Amogh** as part of the **CodeAlpha Web Development Internship**.
