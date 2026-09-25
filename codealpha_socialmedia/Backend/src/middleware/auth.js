const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Authentication Middleware
 * Reads Bearer token from Authorization header, verifies it, and attaches user info to req.user
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token required. Please provide Authorization header with Bearer token' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid Authorization header format. Format must be: Bearer <token>' });
  }

  const token = parts[1];

  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired. Please log in again.' });
      }
      return res.status(403).json({ error: 'Invalid or malformed access token' });
    }

    // Attach decoded user payload to request: { userId, username }
    req.user = decoded;
    next();
  });
};

/**
 * Optional Authentication Middleware
 * If token is present and valid, attaches user; otherwise leaves req.user undefined without blocking.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    jwt.verify(parts[1], config.jwt.secret, (err, decoded) => {
      if (!err && decoded) {
        req.user = decoded;
      }
      next();
    });
  } else {
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
