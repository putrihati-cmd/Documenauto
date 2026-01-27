const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Public routes
router.get('/packages', paymentController.getPackages);
router.get('/payment-methods', paymentController.getPaymentMethods);

// User routes (requires authentication)
router.post('/payment-orders', paymentController.createPaymentOrder);
router.post('/payment-orders/:order_id/proof', 
  paymentController.uploadPaymentProof.single('proof'),
  paymentController.uploadProof
);
router.get('/my-payments', paymentController.getUserPaymentOrders);

// Staff routes (requires staff role)
router.get('/admin/pending-payments', paymentController.getPendingPayments);
router.post('/admin/payments/:order_id/verify', paymentController.verifyPayment);

module.exports = router;
