const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { authMiddleware } = require("../middleware/auth"); // Kiểm tra đường dẫn

router.get("/user", authMiddleware, checkoutController.getUserInfo);
router.post("/user/update", authMiddleware, checkoutController.updateUserInfo);
router.get("/cart", authMiddleware, checkoutController.getCart);
router.post("/discount", authMiddleware, checkoutController.applyDiscount);
router.post("/complete", authMiddleware, checkoutController.completeCheckout);

module.exports = router;
