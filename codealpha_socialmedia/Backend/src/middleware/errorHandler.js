/**
 * Global centralized error handler middleware
 * Returns consistent error response: { error: "message" }
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error encountered:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  // Handle JWT verification errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token has expired' });
  }

  // Handle PostgreSQL / Supabase specific errors
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json({ error: 'Resource already exists with those unique credentials' });
  }
  if (err.code === '23503') {
    // Foreign key violation
    return res.status(404).json({ error: 'Referenced entity not found' });
  }

  // Custom status error
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.details || err.stack }),
  });
};

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
