const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// Public/Guest calculation endpoint (Backend business logic)
router.post('/calculate', cartController.calculateCart);

// Protected routes for persistent user cart
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', validate(cartController.addToCartSchema), cartController.addToCart);
router.put('/:itemId', validate(cartController.updateCartSchema), cartController.updateCartItem);
router.delete('/:itemId', cartController.removeFromCart);
router.post('/sync', cartController.syncCart);

module.exports = router;
