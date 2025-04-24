const express = require("express");
const { getReviewsByProduct, createReview, updateReview, getPublicReviews } = require("../controllers/reviewController");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// Lấy review công khai (không cần đăng nhập)
router.get("/public/:productId", getPublicReviews);

// Lấy review có thông tin của người dùng đã đánh giá (cần đăng nhập)
router.get("/:productId", authMiddleware, getReviewsByProduct);

// Tạo review mới (Cần đăng nhập)
router.post("/:productId", authMiddleware, createReview);

// Cập nhật review (Cần đăng nhập)
router.patch("/:productId", authMiddleware, updateReview);

module.exports = router;
