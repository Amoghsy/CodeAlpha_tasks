const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// All order routes require authentication
router.use(authenticate);

router.post('/', validate(ordersController.createOrderSchema), ordersController.createOrder);
router.get('/', ordersController.getOrders);
router.get('/:id', ordersController.getOrderById);

module.exports = router;
