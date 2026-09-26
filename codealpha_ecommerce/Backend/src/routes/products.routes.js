const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const { validate } = require('../middleware/validate.middleware');

// Public Product routes
router.get('/', validate(productsController.getProductsQuerySchema), productsController.getProducts);
router.get('/:id', productsController.getProductById);

module.exports = router;
