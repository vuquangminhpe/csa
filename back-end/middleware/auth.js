const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Không có token, vui lòng đăng nhập" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
    console.log("Decoded token:", decoded);

    const userId = decoded.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "ID người dùng trong token không hợp lệ" });
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        const userByStringId = await User.findOne({ _id: userId.toString() });

        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      if (user.isBanned) {
        return res.status(403).json({
          message:
            "Tài khoản của bạn đã bị block. Vui lòng liên hệ admin để được hỗ trợ.",
        });
      }

      req.user = user;
      next();
    } catch (findError) {
      console.error("Lỗi khi tìm user:", findError);
      return res
        .status(500)
        .json({ message: "Lỗi khi truy vấn thông tin người dùng" });
    }
  } catch (err) {
    console.error("Lỗi xác thực:", err);
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ khi xác thực người dùng" });
  }
};

exports.checkRole = (roles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role;
      const roleStr = typeof userRole === "string" ? userRole : userRole?.role;
      if (!roles.includes(roleStr)) {
        return res.status(403).json({ message: "Bạn không có quyền truy cập" });
      }
      next();
    } catch (err) {
      console.error("Lỗi kiểm tra vai trò:", err);
      return res
        .status(500)
        .json({ message: "Lỗi máy chủ khi kiểm tra vai trò" });
    }
  };
};

// Middleware kiểm tra quyền admin
exports.adminMiddleware = (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }
    next();
  } catch (err) {
    console.error("Lỗi kiểm tra quyền admin:", err);
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ khi kiểm tra quyền admin" });
  }
};
