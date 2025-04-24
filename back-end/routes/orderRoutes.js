const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/OrderController");
const { authMiddleware } = require("../middleware/auth"); // Xác thực người dùng

//  Lấy danh sách đơn hàng của người dùng
router.get("/orders/customer/:customerId", authMiddleware, OrderController.getOrdersByCustomerId);
router.get('/orders', OrderController.getAllOrders);
router.post("/create", OrderController.createPaymentLink);
router.patch('/orders/:orderId/payment-status', OrderController.updatePaymentStatus);
router.put('/orders/:orderId/status', OrderController.updateOrderStatus);
router.put('/orders/:orderId/confirm-success', authMiddleware, OrderController.confirmOrderSuccess);
router.post('/orders/:orderId/return', authMiddleware, OrderController.requestOrderReturn);

// Tra cứu bảo hành (yêu cầu đăng nhập)
router.get('/warranty', authMiddleware, OrderController.checkWarranty);

// Tra cứu bảo hành công khai (không yêu cầu đăng nhập)
router.get('/warranty/public', OrderController.checkWarrantyPublic);

module.exports = router;
