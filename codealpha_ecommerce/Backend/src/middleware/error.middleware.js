/**
 * 404 Route Not Found handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl} - Route not found.`
  });
}

/**
 * Global centralized error handling middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
