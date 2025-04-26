const express = require('express');
const router = express.Router();
const { checkout } = require('../controllers/checkoutController');
const { authMiddleware } = require('../middleware/auth');

router.post('/checkout', authMiddleware, checkout);

module.exports = router; 