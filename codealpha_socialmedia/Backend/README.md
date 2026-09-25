# 📸 Vibesta Backend API

A high-performance, secure backend for **Vibesta** — an Instagram-style mini social media platform built with **Node.js, Express.js, Supabase (PostgreSQL)**, and **Custom JWT Authentication** (without relying on Supabase Auth).

---

## ⚡ Features & Highlights

- 🔐 **Custom JWT Authentication**: User registration & login with password hashing via `bcryptjs` and 7-day JWT tokens.
- 🛡️ **Role-Level Security & Service Role**: Utilizes Supabase `service_role` key strictly server-side with parameterized queries preventing SQL injection.
- 🗄️ **Node.js Database Version Manager**: Built-in CLI migration tool (`npm run migrate`) to track, apply, and rollback database schema versions.
- 🖼️ **Image Upload Pipeline**: Integrated `multer` memory storage and direct upload to **Supabase Storage** with public CDN URL generation.
- 👥 **Social Graph**: Follow/unfollow toggle mechanism, follower/following lists, and personalized chronologically ordered feeds.
- 💬 **Interactions**: Single-endpoint like/unlike toggling, comment threads, and user profile post grids.
- 🎯 **Input Validation & Error Handling**: Comprehensive request sanitization with `express-validator` and standard `{ error: "message" }` error formatting.
- 🌐 **CORS & Security**: Configured with `helmet`, CORS origin whitelisting, and `morgan` logging.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js & Express.js** | Backend REST API Framework |
| **Supabase (PostgreSQL)** | Relational Database & Storage CDN |
| **`@supabase/supabase-js`** | Database queries with service_role key & Storage client |
| **`pg` (node-postgres)** | Direct connection pool & Database Version Manager runner |
| **`jsonwebtoken`** | Stateless Bearer token generation and verification |
| **`bcryptjs`** | Salted password hashing (10 rounds) |
| **`multer`** | Multi-part form-data / image upload handling |
| **`express-validator`** | Request body and parameter validation rules |

---

## 📁 Project Structure

```text
Backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # Supabase & PostgreSQL client connections
│   │   └── env.js                # Environment variable loader & validator
│   ├── controllers/
│   │   ├── authController.js     # Register & Login controllers
│   │   ├── commentController.js  # Add, get, delete comments
│   │   ├── likeController.js     # Toggle like, list post likes
│   │   ├── postController.js     # Feed, create, view, delete posts
│   │   ├── uploadController.js   # Image upload controller
│   │   └── userController.js     # Profile, update me, follow graph
│   ├── db/
│   │   ├── migrations/           # Versioned SQL migration files
│   │   │   ├── 001_create_users_table.sql
│   │   │   ├── 002_create_posts_table.sql
│   │   │   ├── 003_create_comments_table.sql
│   │   │   ├── 004_create_likes_table.sql
│   │   │   └── 005_create_follows_table.sql
│   │   ├── migrate.js            # Node Database Version Manager CLI
│   │   ├── schema.sql            # Consolidated Supabase SQL script
│   │   └── seed.js               # Sample demo data seeder
│   ├── middleware/
│   │   ├── auth.js               # authenticateToken & optionalAuth JWT middlewares
│   │   ├── errorHandler.js       # Centralized error handler ({ error: "..." })
│   │   ├── upload.js             # Multer image filter & size limit config
│   │   └── validate.js           # express-validator result handler
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── commentRoutes.js      # /api/comments
│   │   ├── index.js              # Combined API router & health check
│   │   ├── postRoutes.js         # /api/posts
│   │   ├── uploadRoutes.js       # /api/upload
│   │   └── userRoutes.js         # /api/users
│   ├── app.js                    # Express application configuration
│   └── server.js                 # HTTP Server bootstrap & graceful shutdown
├── .env.example                  # Template environment variables
├── package.json
└── README.md
```

---

## 🗄️ Database Schema

### 1. `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique user identifier |
| `username` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Handle / username (lowercase) |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | User email address |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt hashed password |
| `full_name` | `VARCHAR(100)` | `NULLABLE` | Display name |
| `bio` | `TEXT` | `NULLABLE` | User biography |
| `avatar_url` | `TEXT` | `NULLABLE` | Profile picture URL |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Profile update timestamp |

### 2. `posts`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique post identifier |
| `user_id` | `UUID` | `FK -> users.id ON DELETE CASCADE, NOT NULL` | Author of the post |
| `caption` | `TEXT` | `NULLABLE` | Post text/caption |
| `image_url` | `TEXT` | `NOT NULL` | Hosted image URL |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Modification timestamp |

### 3. `comments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique comment identifier |
| `post_id` | `UUID` | `FK -> posts.id ON DELETE CASCADE, NOT NULL` | Target post |
| `user_id` | `UUID` | `FK -> users.id ON DELETE CASCADE, NOT NULL` | Comment author |
| `content` | `TEXT` | `NOT NULL` | Comment text |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Modification timestamp |

### 4. `likes`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique like identifier |
| `post_id` | `UUID` | `FK -> posts.id ON DELETE CASCADE, NOT NULL` | Target post |
| `user_id` | `UUID` | `FK -> users.id ON DELETE CASCADE, NOT NULL` | User who liked |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Like timestamp |
| **Constraint** | `UNIQUE(post_id, user_id)` | Prevents duplicate likes |

### 5. `follows`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique follow identifier |
| `follower_id` | `UUID` | `FK -> users.id ON DELETE CASCADE, NOT NULL` | The follower |
| `following_id` | `UUID` | `FK -> users.id ON DELETE CASCADE, NOT NULL` | The user being followed |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Follow timestamp |
| **Constraint** | `UNIQUE(follower_id, following_id)` | Prevents duplicate follows |
| **Constraint** | `CHECK(follower_id != following_id)` | Prevents following oneself |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or newer)
- A **Supabase** account and project (free at [supabase.com](https://supabase.com))

### 2. Installation
```bash
cd Backend
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5500

# Supabase Credentials (Project Settings -> API)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
SUPABASE_STORAGE_BUCKET=vibesta-media

# Direct PostgreSQL Connection String (Project Settings -> Database -> Connection URI)
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

---

## 📦 Database Setup Options

### Option A: Using the Node.js Database Version Manager (CLI)
Vibesta comes with a built-in migration runner that executes and tracks schema versions in `schema_migrations`:

```bash
# Check current migration status
npm run migrate:status

# Apply all pending migrations
npm run migrate:up

# Rollback the last applied migration
npm run migrate:down
```

### Option B: Supabase SQL Editor
If you prefer running the SQL in the Supabase Dashboard:
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Copy and paste the contents of `src/db/schema.sql`.
3. Click **Run**.

### Supabase Storage Bucket Setup
1. In Supabase Dashboard, go to **Storage**.
2. Create a bucket named `vibesta-media` (or the name set in `SUPABASE_STORAGE_BUCKET`).
3. Set the bucket to **Public** so uploaded avatars and post images are publicly accessible.

---

## 🏃 Running the Server

```bash
# Start in development mode with nodemon
npm run dev

# Start in production mode
npm start

# (Optional) Seed sample demo data
npm run seed
```

The API will be available at: `http://localhost:5000`

---

## 📡 API Reference & Endpoints

### 🔒 Authentication Flow
Protected routes require the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
```

---

### 1. Auth Endpoints

#### Register User
`POST /api/auth/register`
```json
// Request Body
{
  "username": "vibeking",
  "email": "vibe@vibesta.app",
  "password": "securepassword123",
  "full_name": "Vibe King",
  "bio": "Creating aesthetic content 📸",
  "avatar_url": "https://example.com/avatar.jpg"
}

// Response (201 Created)
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "c1f7a29e-...",
    "username": "vibeking",
    "email": "vibe@vibesta.app",
    "full_name": "Vibe King",
    "bio": "Creating aesthetic content 📸",
    "avatar_url": "https://example.com/avatar.jpg",
    "created_at": "2026-09-25T14:30:00.000Z"
  }
}
```

#### Login User
`POST /api/auth/login`
```json
// Request Body (Accepts username or email)
{
  "identifier": "vibeking",
  "password": "securepassword123"
}

// Response (200 OK)
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "c1f7a29e-...",
    "username": "vibeking",
    "email": "vibe@vibesta.app",
    "full_name": "Vibe King",
    "bio": "Creating aesthetic content 📸",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

---

### 2. Users & Follow Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | Yes | Get logged-in user profile with stats |
| `PUT` | `/api/users/me` | Yes | Update profile (`bio`, `avatar_url`, `full_name`) |
| `GET` | `/api/users/:username` | Optional | Public profile + follower/post counts |
| `POST` | `/api/users/:username/follow` | Yes | Toggle follow/unfollow a user |
| `GET` | `/api/users/:username/followers` | No | List of followers |
| `GET` | `/api/users/:username/following` | No | List of accounts followed |
| `GET` | `/api/users/:username/posts` | Optional | User's posts grid (paginated) |

---

### 3. Posts Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/posts` | Yes | Create post (`image_url`, `caption`) |
| `GET` | `/api/posts/feed` | Yes | Paginated home feed from followed users + self |
| `GET` | `/api/posts/:id` | Optional | Single post with like/comment counts & author |
| `DELETE` | `/api/posts/:id` | Yes | Delete post (Owner only) |

#### Feed Request Example:
`GET /api/posts/feed?page=1&limit=10`
```json
// Response (200 OK)
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasMore": true
  },
  "posts": [
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "caption": "Neon lights in Tokyo! 🌃",
      "image_url": "https://...",
      "created_at": "2026-09-25T14:00:00.000Z",
      "user": {
        "id": "c1f7a29e-...",
        "username": "alex_vibes",
        "full_name": "Alex Rivera",
        "avatar_url": "https://..."
      },
      "likes_count": 14,
      "comments_count": 3,
      "is_liked": true
    }
  ]
}
```

---

### 4. Comments Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/posts/:postId/comments` | Yes | Add comment (`content`) |
| `GET` | `/api/posts/:postId/comments` | No | List all comments on a post |
| `DELETE` | `/api/comments/:id` | Yes | Delete comment (Owner only) |

---

### 5. Likes Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/posts/:postId/like` | Yes | Toggle like/unlike |
| `GET` | `/api/posts/:postId/likes` | No | List users who liked the post |

```json
// Toggle Like Response (200 OK)
{
  "message": "Post liked successfully",
  "is_liked": true,
  "likes_count": 15
}
```

---

### 6. Media Upload Endpoint

#### Upload Post Image or Avatar
`POST /api/upload?folder=posts` *(or `?folder=avatars`)*
- Header: `Authorization: Bearer <token>`
- Body: `multipart/form-data` with field `image` (JPEG, PNG, WEBP, GIF, max 5MB)

```json
// Response (200 OK)
{
  "message": "Image uploaded successfully",
  "url": "https://your-project.supabase.co/storage/v1/object/public/vibesta-media/posts/1727278291000-abcd1234.jpg"
}
```

---

## 🛡️ Error Response Format

All errors across all endpoints consistently return JSON:

```json
{
  "error": "Descriptive error message"
}
```

Common HTTP status codes:
- `200 OK` / `201 Created` - Success
- `400 Bad Request` - Invalid input / missing fields
- `401 Unauthorized` - Missing or expired JWT token
- `403 Forbidden` - User lacks permission (e.g. trying to delete someone else's post)
- `404 Not Found` - Resource (user, post, comment) not found
- `409 Conflict` - Username or email already registered
- `500 Internal Server Error` - Server-side unhandled exception
