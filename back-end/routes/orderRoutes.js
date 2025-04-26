const express = require('express');
const router = express.Router();
const { updateOrderStatus, handleSuccessfulPayment } = require('../controllers/orderController');

// Update order status
router.put('/:orderId/status', updateOrderStatus);

// Handle successful payment
router.post('/:orderId/payment/success', handleSuccessfulPayment);

module.exports = router; 