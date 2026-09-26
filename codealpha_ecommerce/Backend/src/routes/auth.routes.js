const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// Public Auth routes
router.post('/register', validate(authController.registerSchema), authController.register);
router.post('/login', validate(authController.loginSchema), authController.login);
router.post('/logout', authController.logout);

// Protected Auth routes
router.get('/me', authenticate, authController.getMe);

module.exports = router;
