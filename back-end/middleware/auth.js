const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

// Xác thực người dùng
exports.authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token, vui lòng đăng nhập" });
    }

    const token = authHeader.split(" ")[1];

    // Giải mã token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // Kiểm tra _id có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(decoded._id)) {
      return res.status(400).json({ message: "ID người dùng trong token không hợp lệ" });
    }

    // Kiểm tra xem user có tồn tại trong database không
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra nếu người dùng bị block (isBanned)
    if (user.isBanned) {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị block. Vui lòng liên hệ admin để được hỗ trợ." });
    }

    // Gán user vào req để sử dụng sau này
    req.user = user;
    next();
  } catch (err) {
    console.error("Lỗi xác thực:", err);
    return res.status(500).json({ message: "Lỗi máy chủ khi xác thực người dùng" });
  }
};

// Kiểm tra quyền truy cập dựa trên vai trò
exports.checkRole = (roles) => {
  return (req, res, next) => {
    // Giả sử req.user đã được gán bởi authMiddleware
    const userRole = req.user.role;
    // Nếu userRole không phải là chuỗi, chuyển đổi thành chuỗi (hoặc lấy thuộc tính 'role' nếu đã populate)
    const roleStr = typeof userRole === "string" ? userRole : userRole?.role;
    if (!roles.includes(roleStr)) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }
    next();
  };
};
