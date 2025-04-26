const express = require("express");
const router = express.Router();
const shippingController = require("../controllers/ShippingController");
const { authMiddleware } = require("../middleware/auth");

// Tạo vận đơn mới cho đơn hàng
router.post(
  "/create/:orderId",
  authMiddleware,
  shippingController.createShipment
);

// Lấy thông tin vận chuyển theo mã vận đơn
router.get(
  "/tracking/:trackingNumber",
  shippingController.getShipmentByTracking
);

// Lấy vị trí hiện tại của shipper
router.get("/location/:trackingNumber", shippingController.getShipperLocation);

// Cập nhật trạng thái vận chuyển (thủ công)
router.put(
  "/:trackingNumber",
  authMiddleware,
  shippingController.updateShipmentStatus
);

module.exports = router;
