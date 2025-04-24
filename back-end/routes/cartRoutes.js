const express = require("express");
const router = express.Router();
const CartController = require("../controllers/CartController");
const { authMiddleware } = require("../middleware/auth"); // Kiểm tra đường dẫn

// Lấy giỏ hàng của người dùng
router.get("/cart", authMiddleware, CartController.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post("/cart", authMiddleware, CartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put("/cart", authMiddleware, CartController.updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete("/cart", authMiddleware, CartController.removeFromCart);

module.exports = router;