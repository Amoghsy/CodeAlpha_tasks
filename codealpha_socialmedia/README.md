# Vibesta • Full-Stack Social Media Platform

<div align="center">
  <img src="./Frontend/assets/logo.svg" alt="Vibesta Logo" width="80" height="80" />
  <h3>A modern, responsive, Instagram-style mini social media platform built for the CodeAlpha Internship.</h3>
</div>

---

## 🌟 Overview

**Vibesta** is a full-stack social media application featuring custom JWT authentication, post creation, double-tap liking, real-time comment threads, user profiles, stories, follow/unfollow functionality, and PostgreSQL persistence with Supabase.

---

## 🚀 Key Features

- **🔐 Custom JWT Authentication**:
  - Secure user registration and login with bcrypt password hashing.
  - JWT token management with client-side route guards.
  - Automatic session expiration and protected routes.

- **📸 Interactive Feed**:
  - Personalized feed combining posts from followed accounts + own posts.
  - Automatic global discovery fallback for new users.
  - Double-tap on photo to like with animated heart pop effect.
  - Inline comment preview and quick comment box.
  - Sticky right desktop sidebar with user profile pill and suggestions.

- **✨ Stories Carousel & Viewer**:
  - Instagram-style circular story rings with gradient borders.
  - Interactive full-screen story viewer with multi-segment timer bars and touch pause.

- **👤 User Profiles & Follow System**:
  - 3-column responsive post grid with hover overlay (showing like & comment counts).
  - Dynamic follow / unfollow toggle with real-time follower/following counter updates.
  - Editable bio, full name, and avatar image.

- **📝 Post Creation & Media Handling**:
  - Create posts with local file upload, Unsplash sample picks, or direct URLs.
  - Aspect ratio toggle (Square 1:1 vs Portrait 4:5) with live preview.
  - Character counter and quick hashtag suggestions.

- **🛡️ Resilient Architecture**:
  - Direct PostgreSQL queries via connection pooler.
  - Version-controlled SQL migration system.
  - On-demand offline fallback if the backend server is unreachable.

---

## 🛠️ Technology Stack

### Frontend
- **HTML5 & Vanilla JavaScript (ES6+)**
- **Tailwind CSS (CDN)** for styling & responsive layout
- **Custom CSS** for animations, glassmorphism, and scrollbars
- **Fetch API Client** with automatic token injection and error handling

### Backend
- **Node.js & Express.js**
- **PostgreSQL** (via Supabase database)
- **`pg` (node-postgres)** for custom versioned migration runner
- **`@supabase/supabase-js`** for query operations and storage
- **`jsonwebtoken`** for authentication tokens
- **`bcryptjs`** for password hashing
- **`express-validator`** for request payload validation
- **`multer`** for multipart file uploads

---

## 📁 Project Structure

```
codealpha_socialmedia/
├── Backend/
│   ├── src/
│   │   ├── config/          # Environment & Database config
│   │   ├── controllers/     # Route logic (auth, post, user, comment, like)
│   │   ├── db/
│   │   │   ├── migrations/  # Version-controlled SQL schema files
│   │   │   ├── migrate.js   # Custom Node.js migration runner
│   │   │   └── seed.js      # Demo data seeder
│   │   ├── middleware/      # JWT auth, error handling, validation, upload
│   │   ├── routes/          # Express API route endpoints
│   │   ├── services/        # Supabase storage service
│   │   ├── app.js           # Express app setup & middleware
│   │   └── server.js        # Server listener entry point
│   ├── .env.example         # Example environment variables
│   └── package.json
│
└── Frontend/
    ├── assets/              # SVG Logos, icons, sample images
    ├── css/
    │   └── style.css        # Custom styles, animations, keyframes
    ├── js/
    │   ├── api.js           # Centralized API client & HTTP wrapper
    │   ├── auth.js          # Authentication state & route guards
    │   ├── config.js        # App configuration & endpoints
    │   ├── feed.js          # Feed rendering & interactions
    │   ├── navbar.js        # Global navigation & create post modal
    │   ├── post.js          # Single post detail view & comments
    │   ├── profile.js       # Profile header & grid controller
    │   ├── story.js         # Full-screen story player modal
    │   └── upload.js        # Create post & edit profile forms
    └── pages/
        ├── index.html       # Main Feed & Stories
        ├── login.html       # User Login
        ├── register.html    # User Registration
        ├── create-post.html # Post Creation Page
        ├── post.html        # Single Post Detail
        ├── profile.html     # User Profile Page
        └── edit-profile.html# Edit Profile Page
```

---

## ⚡ Quick Start Guide

### 1. Backend Setup

1. **Navigate to the Backend directory:**
   ```bash
   cd codealpha_socialmedia/Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in `Backend/` based on `.env.example`:
   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5500,http://localhost:5500

   # Supabase & PostgreSQL Credentials
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_STORAGE_BUCKET=vibesta-media
   DATABASE_URL=postgresql://postgres.xxx:password@aws-0-xx.pooler.supabase.com:6543/postgres

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_EXPIRES_IN=7d
   ```

4. **Run Database Migrations:**
   ```bash
   npm run migrate
   ```

5. **(Optional) Seed Demo Data:**
   ```bash
   npm run seed
   ```
   *Seeds 7 demo creator accounts, high-resolution posts, comments, likes, and follow relationships. Password for all seeded accounts is `password123`.*

6. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *Server runs at `http://localhost:5000`.*

---

### 2. Frontend Setup

1. Open `codealpha_socialmedia/Frontend/pages/index.html` in your browser, or serve using VS Code **Live Server** (`http://127.0.0.1:5500/pages/index.html`).
2. Log in using a seeded account (e.g. `sarah_designs` / `password123`) or register a new account at `register.html`.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/posts/feed` | Get followed posts + own posts feed | Yes |
| `POST` | `/api/posts` | Create a new post (`{ image_url, caption }`) | Yes |
| `GET` | `/api/posts/:id` | Get single post details with counts | Optional |
| `DELETE` | `/api/posts/:id` | Delete post (owner only) | Yes |
| `POST` | `/api/posts/:postId/like` | Toggle like / unlike on post | Yes |
| `GET` | `/api/posts/:postId/comments` | Get comments for a post | No |
| `POST` | `/api/posts/:postId/comments` | Add comment to a post | Yes |
| `GET` | `/api/users/:username` | Get public profile and counts | Optional |
| `GET` | `/api/users/:username/posts` | Get posts by specific user | Optional |
| `POST` | `/api/users/:username/follow` | Toggle follow / unfollow user | Yes |
| `PUT` | `/api/users/me` | Update logged-in user profile | Yes |
| `POST` | `/api/upload` | Upload image file to storage | Yes |
| `GET` | `/api/health` | Health check status | No |

---

## 📄 License

This project was built as part of the **CodeAlpha Internship Program**.
