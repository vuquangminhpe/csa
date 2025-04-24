const Notification = require("../models/Notification");

// 📌 API: Lấy danh sách thông báo của user theo bộ lọc
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, page = 1, limit = 5 } = req.query;

    let filter = { user: userId };
    if (type) {
      filter.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const total = await Notification.countDocuments(filter); // Đếm tổng số thông báo
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ notifications, total }); // Trả về tổng số và danh sách thông báo
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông báo", error });
  }
};

// 📌 API: Đánh dấu một thông báo là đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.json({ message: "Thông báo đã được đánh dấu đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật thông báo", error });
  }
};

// 📌 API: Đánh dấu tất cả thông báo là đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany({ user: userId }, { isRead: true });
    res.json({ message: "Tất cả thông báo đã được đánh dấu đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật thông báo", error });
  }
};
