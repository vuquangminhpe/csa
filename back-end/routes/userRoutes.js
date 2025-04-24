const express = require("express");
const {
  register,
  login,
  getAllUsers,
  getUserById,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  blockUser,
  updateUserRole,
  googleLogin,
} = require("../controllers/userController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

// Chỉ admin (hoặc những người đã đăng nhập với quyền phù hợp) sẽ truy cập getAllUsers
router.get("/", authMiddleware, getAllUsers);

// 🚀 Đảm bảo route /profile được đặt trước route /:id
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUserProfile);

router.put("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/verify-email/:token", verifyEmail);

// Block/Unblock user (chỉ cần authMiddleware nếu bạn đã kiểm tra quyền khi đăng nhập)
router.patch('/block/:userId', authMiddleware, blockUser);

// Cập nhật role cho user
router.patch('/role/:userId', authMiddleware, updateUserRole);

// 🚀 Đặt route /:id ở cuối cùng để không bị xung đột với route /profile
router.get("/:id", getUserById);
router.post('/google-login', googleLogin);

module.exports = router;
