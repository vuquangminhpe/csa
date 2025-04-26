const Order = require("../models/Orders");
const {
  sendPaymentConfirmationEmail,
  sendOrderStatusUpdateEmail,
} = require("../services/emailService");

const checkAndUpdateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("userId", "email name")
      .populate("items");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    let statusChanged = false;
    let newStatus = order.status;
    let statusMessage = "";

    if (
      order.paymentStatus === "Đã thanh toán" &&
      order.status === "Đang xử lý"
    ) {
      newStatus = "Đã xác nhận";
      statusMessage = "Đơn hàng đã được xác nhận và đang chuẩn bị hàng";
      statusChanged = true;
    } else if (
      order.status === "Đã xác nhận" &&
      order.shippingStatus === "Đang giao hàng"
    ) {
      newStatus = "Đang giao";
      statusMessage = "Đơn hàng đang được giao đến bạn";
      statusChanged = true;
    } else if (
      order.shippingStatus === "Đã giao hàng" &&
      order.status !== "Đã hoàn thành"
    ) {
      newStatus = "Đã hoàn thành";
      statusMessage = "Đơn hàng đã được giao thành công";
      statusChanged = true;
    }

    if (statusChanged) {
      // Cập nhật trạng thái đơn hàng
      order.status = newStatus;
      order.updatedAt = new Date();
      await order.save();

      // Tạo thông báo cho người dùng
      const notification = new Notification({
        user: order.userId._id,
        type: "order",
        message: `${statusMessage} (Mã đơn hàng: #${order.order_code})`,
        link: `/orders/${order._id}`,
        isRead: false,
        relevantId: order._id,
        relevantModel: "Order",
      });
      await notification.save();

      // Gửi email thông báo
      await sendOrderStatusUpdateEmail(order.userId.email, {
        orderId: order._id,
        orderCode: order.order_code,
        status: order.status,
        customerName: order.userId.name,
      });

      // Gửi thông báo qua socket
      const io = socketManager.getIO();
      if (io) {
        const statusData = {
          orderId: order._id.toString(),
          orderCode: order.order_code,
          status: newStatus,
          message: statusMessage,
          timestamp: new Date(),
        };

        // Thông báo đến phòng của đơn hàng cụ thể
        io.to(`order_${order._id}`).emit("orderStatusChanged", statusData);

        // Thông báo đến phòng của tất cả đơn hàng của người dùng
        io.to(`user_orders_${order.userId._id}`).emit(
          "orderStatusChanged",
          statusData
        );
      }

      return res.status(200).json({
        message: "Trạng thái đơn hàng đã được cập nhật",
        order,
        statusChanged: true,
        previousStatus: order.status !== newStatus ? order.status : null,
        newStatus,
      });
    }

    // Nếu không có thay đổi trạng thái
    return res.status(200).json({
      message: "Không có thay đổi trạng thái đơn hàng",
      order,
      statusChanged: false,
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra và cập nhật trạng thái đơn hàng:", error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi khi kiểm tra trạng thái đơn hàng",
      error: error.message,
    });
  }
};
// Update order status and send email notification
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order status
    order.status = status;
    order.updatedAt = new Date();
    await order.save();

    // Send email notification
    await sendOrderStatusUpdateEmail(order.userEmail, {
      orderId: order._id,
      status: order.status,
    });

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

// Handle successful payment and send confirmation email
const handleSuccessfulPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update payment status
    order.paymentStatus = "paid";
    order.paymentMethod = paymentMethod;
    order.paymentDate = new Date();
    await order.save();

    // Send payment confirmation email
    await sendPaymentConfirmationEmail(order.userEmail, {
      orderId: order._id,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
    });

    res.json({ message: "Payment processed successfully", order });
  } catch (error) {
    console.error("Error processing payment:", error);
    res
      .status(500)
      .json({ message: "Error processing payment", error: error.message });
  }
};

module.exports = {
  checkAndUpdateOrderStatus,
  updateOrderStatus,
  handleSuccessfulPayment,
};
