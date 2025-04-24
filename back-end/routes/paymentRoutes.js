const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authMiddleware } = require("../middleware/auth");


// Nhận webhook từ PayOS
router.post("/webhook", paymentController.handleWebhook);
router.post("/create-payment", paymentController.createPayment);
router.post('/payos-callback', paymentController.handlePayOSCallback);
router.get('/fix-failed-orders', paymentController.fixFailedPaymentOrders);

// Thêm route mới để lấy link thanh toán
router.get("/payment-link/:orderId", authMiddleware, paymentController.getPaymentLink);

module.exports = router;
