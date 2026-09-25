const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (config.corsOrigin === '*' || config.corsOrigin.includes(origin) || config.corsOrigin.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// HTTP request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base Welcome Route
app.get('/', (req, res) => {
  res.json({
    app: 'Vibesta Backend API',
    tagline: 'Mini Social Media Backend for Vibesta',
    status: 'online',
    version: '1.0.0',
    documentation: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
      users: {
        getProfile: 'GET /api/users/:username',
        getMe: 'GET /api/users/me',
        updateMe: 'PUT /api/users/me',
        toggleFollow: 'POST /api/users/:username/follow',
        followers: 'GET /api/users/:username/followers',
        following: 'GET /api/users/:username/following',
        posts: 'GET /api/users/:username/posts',
      },
      posts: {
        create: 'POST /api/posts',
        feed: 'GET /api/posts/feed',
        getById: 'GET /api/posts/:id',
        delete: 'DELETE /api/posts/:id',
        addComment: 'POST /api/posts/:postId/comments',
        getComments: 'GET /api/posts/:postId/comments',
        toggleLike: 'POST /api/posts/:postId/like',
        getLikes: 'GET /api/posts/:postId/likes',
      },
      upload: {
        media: 'POST /api/upload',
      },
    },
  });
});

// Mount Main API Routes
app.use('/api', apiRoutes);

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
