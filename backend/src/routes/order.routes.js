const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Create new order with file upload
router.post('/orders', orderController.upload.single('file'), orderController.createOrder);

// Get order by ID
router.get('/orders/:orderId', orderController.getOrder);

// List all orders (with optional filtering)
router.get('/orders', orderController.listOrders);

// Update order status (for staff)
router.patch('/orders/:orderId/status', orderController.updateOrderStatus);

module.exports = router;
