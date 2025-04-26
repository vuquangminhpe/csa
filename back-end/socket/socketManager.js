const Order = require("../models/Orders");
const Notification = require("../models/Notification");

let io;
// Lưu trữ các timeout để có thể hủy nếu cần
const orderTimeouts = new Map();

const initSocket = (server) => {
  io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinOrderRoom", (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`User ${socket.id} joined order room: order_${orderId}`);
    });

    socket.on("joinUserOrdersRoom", (userId) => {
      socket.join(`user_orders_${userId}`);
      console.log(
        `User ${socket.id} joined user orders room: user_orders_${userId}`
      );
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  console.log("Socket.IO initialized successfully");
  return io;
};

const cancelOrderAfterTimeout = async (orderId, userId) => {
  try {
    // Xóa timeout khỏi danh sách theo dõi
    orderTimeouts.delete(orderId);

    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order ${orderId} not found for cancellation`);
      return;
    }
    if (
      order.paymentStatus === "Chờ thanh toán" &&
      (order.status === "Đang xử lý" || order.status === "Đã xác nhận")
    ) {
      console.log(`Cancelling order ${orderId} due to payment timeout`);

      order.status = "Đã hủy";
      order.paymentStatus = "Thanh toán thất bại";
      order.cancelReason = "Hết thời gian thanh toán";
      order.cancelledBy = "Hệ thống";
      order.cancelledAt = new Date();

      await order.save();

      const notification = new Notification({
        user: userId,
        type: "order",
        message: `Đơn hàng #${order.order_code} đã bị hủy tự động do quá thời gian thanh toán`,
        link: `/orders/${orderId}`,
        isRead: false,
      });
      await notification.save();

      if (io) {
        io.to(`order_${orderId}`).emit("orderCancelled", {
          orderId: orderId,
          orderCode: order.order_code,
          reason: "Hết thời gian thanh toán",
          timestamp: new Date(),
        });
        io.to(`user_orders_${userId}`).emit("orderStatusChanged", {
          orderId: orderId,
          orderCode: order.order_code,
          status: "Đã hủy",
          reason: "Hết thời gian thanh toán",
          timestamp: new Date(),
        });
      }

      console.log(
        `Order ${orderId} has been automatically cancelled due to payment timeout`
      );
    } else {
      console.log(
        `Order ${orderId} is not eligible for automatic cancellation. Status: ${order.status}, Payment Status: ${order.paymentStatus}`
      );
    }
  } catch (error) {
    console.error(`Error when cancelling order ${orderId}:`, error);
  }
};

const setOrderPaymentTimeout = (orderId, userId, timeoutMs = 900000) => {
  // 15 phút (900000ms)
  console.log(`Setting payment timeout for order ${orderId}: ${timeoutMs}ms`);

  // Hủy timeout cũ nếu đã tồn tại
  clearOrderPaymentTimeout(orderId);

  // Tạo timeout mới
  const timeoutId = setTimeout(() => {
    cancelOrderAfterTimeout(orderId, userId);
  }, timeoutMs);

  // Lưu timeout ID để có thể hủy nếu cần
  orderTimeouts.set(orderId, timeoutId);
};

/**
 * Hủy timeout thanh toán đơn hàng
 * @param {string} orderId - ID của đơn hàng
 */
const clearOrderPaymentTimeout = (orderId) => {
  const existingTimeout = orderTimeouts.get(orderId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    orderTimeouts.delete(orderId);
    console.log(`Cleared payment timeout for order ${orderId}`);
  }
};

/**
 * Phát thông báo mới cho người dùng
 * @param {string} userId - ID của người dùng nhận thông báo
 * @param {Object} notification - Thông tin thông báo
 */
const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit("notification", notification);
  }
};

/**
 * Phát sự kiện cập nhật trạng thái đơn hàng
 * @param {string} orderId - ID của đơn hàng
 * @param {string} userId - ID của người dùng
 * @param {Object} statusData - Dữ liệu trạng thái mới
 */
const emitOrderStatusUpdate = (orderId, userId, statusData) => {
  if (io) {
    io.to(`order_${orderId}`).emit("orderStatusChanged", statusData);
    io.to(`user_orders_${userId}`).emit("orderStatusChanged", statusData);
  }
};

module.exports = {
  initSocket,
  setOrderPaymentTimeout,
  clearOrderPaymentTimeout,
  emitNotification,
  emitOrderStatusUpdate,
  getIO: () => io,
};
