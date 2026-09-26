const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// All cart routes require authentication
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', validate(cartController.addToCartSchema), cartController.addToCart);
router.put('/:itemId', validate(cartController.updateCartSchema), cartController.updateCartItem);
router.delete('/:itemId', cartController.removeFromCart);
router.post('/sync', cartController.syncCart);

module.exports = router;
