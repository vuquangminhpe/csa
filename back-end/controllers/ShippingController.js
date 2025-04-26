const mongoose = require("mongoose");
const Order = require("../models/Orders");
const Notification = require("../models/Notification");
const axios = require("axios");
const crypto = require("crypto");

// Lưu trữ vị trí giả lập của shipper (sẽ được cập nhật khi shipper di chuyển)
const shipperLocations = new Map();

// Hàm tạo mã vận đơn ngẫu nhiên, độ dài 12 ký tự
const generateTrackingNumber = () => {
  return "GU" + crypto.randomBytes(5).toString("hex").toUpperCase();
};

// Hàm tạo mã đơn hàng
const generateOrderCode = () => {
  return "ORD-" + Date.now().toString().substr(-8);
};

// Tính khoảng cách giữa hai tọa độ (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính trái đất tính bằng km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Khoảng cách tính bằng km
};

// Tạo mã vận đơn và bắt đầu quá trình vận chuyển
exports.createShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customerLocation } = req.body;

    if (
      !customerLocation ||
      !customerLocation.latitude ||
      !customerLocation.longitude
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tọa độ của khách hàng",
      });
    }

    // Tìm đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Kiểm tra và đảm bảo order có tất cả các trường cần thiết
    // Order có thể đã được tạo từ mô hình Order.js (không phải Orders.js)

    // Đảm bảo trạng thái đơn hàng
    // Nếu order.status là 'pending' từ checkout controller, chuyển sang 'Đã xác nhận'
    if (order.status === "pending") {
      order.status = "Đã xác nhận";
    }

    if (order.status !== "Đã xác nhận") {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng hiện đang ở trạng thái ${order.status}, không thể tạo vận đơn`,
      });
    }

    // Đảm bảo có order_code
    if (!order.order_code) {
      order.order_code = generateOrderCode();
    }

    // Đảm bảo có total_price, chuyển đổi từ total nếu cần
    if (!order.total_price && order.total) {
      order.total_price = order.total;
    } else if (!order.total_price && order.items && order.items.length > 0) {
      order.total_price = order.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );
    }

    // Đảm bảo có customer_id
    const userId = req.user ? req.user.userId : null;
    if (!order.customer_id) {
      // Thử các trường khác nhau có thể chứa ID người dùng
      order.customer_id =
        userId || order.userId || (order.customer && order.customer._id);
    }

    // Validate các trường bắt buộc trước khi tiếp tục
    if (!order.order_code || !order.customer_id || !order.total_price) {
      console.error("Missing required fields:", {
        order_code: order.order_code,
        customer_id: order.customer_id,
        total_price: order.total_price,
      });

      return res.status(400).json({
        success: false,
        message: "Đơn hàng không đủ thông tin cần thiết để tạo vận đơn",
        error:
          "Thiếu một hoặc nhiều trường: total_price, order_code, customer_id",
      });
    }

    // Tạo mã vận đơn
    const trackingNumber = generateTrackingNumber();

    // Tọa độ giả lập của kho hàng GearUp
    const warehouseLocation = {
      latitude: 10.762622, // Tọa độ kho hàng (ví dụ tại TPHCM)
      longitude: 106.660172,
    };

    // Tính khoảng cách từ kho đến khách hàng
    const distance = calculateDistance(
      warehouseLocation.latitude,
      warehouseLocation.longitude,
      customerLocation.latitude,
      customerLocation.longitude
    );

    // Tính thời gian giao hàng dự kiến (trung bình 15km/h)
    const estimatedHours = distance / 15;
    const estimatedTimeInMs = estimatedHours * 60 * 60 * 1000;

    const deliveryEstimate = new Date(Date.now() + estimatedTimeInMs);

    // Lưu thông tin vận chuyển vào đơn hàng
    order.shippingInfo = {
      trackingNumber,
      status: "Đang chuẩn bị hàng",
      createdAt: new Date(),
      estimatedDelivery: deliveryEstimate,
      distance: Math.round(distance * 10) / 10, // Làm tròn 1 chữ số thập phân
      currentLocation: warehouseLocation,
      customerLocation,
      history: [
        {
          status: "Đang chuẩn bị hàng",
          timestamp: new Date(),
          description: "Đơn hàng đang được chuẩn bị tại kho",
        },
      ],
    };

    // Cập nhật trạng thái đơn hàng
    order.status = "Đang chuẩn bị giao";

    console.log("Saving order with fields:", {
      _id: order._id,
      customer_id: order.customer_id,
      order_code: order.order_code,
      total_price: order.total_price,
      status: order.status,
    });

    await order.save();

    // Tạo thông báo cho khách hàng
    const notification = new Notification({
      user: order.customer_id,
      type: "shipping",
      message: `Đơn hàng #${order.order_code} đã được xử lý và sẽ sớm được giao đến bạn. Mã vận đơn: ${trackingNumber}`,
      link: `/orders/${order._id}`,
      isRead: false,
    });
    await notification.save();

    // Lưu vị trí của shipper (ban đầu là vị trí kho)
    shipperLocations.set(trackingNumber, {
      currentLocation: { ...warehouseLocation },
      orderId: order._id,
      customerId: order.customer_id,
      status: "Đang chuẩn bị hàng",
      lastUpdated: new Date(),
    });

    // Bắt đầu quá trình giả lập di chuyển của shipper
    simulateShipperMovement(
      trackingNumber,
      warehouseLocation,
      customerLocation
    );

    return res.status(200).json({
      success: true,
      message: "Đã tạo vận đơn thành công",
      shipment: {
        trackingNumber,
        status: "Đang chuẩn bị hàng",
        estimatedDelivery: deliveryEstimate,
        distance: Math.round(distance * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo vận đơn:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo vận đơn",
      error: error.message,
    });
  }
};

// Giả lập quá trình di chuyển của shipper
const simulateShipperMovement = (
  trackingNumber,
  startLocation,
  endLocation
) => {
  // Tính khoảng cách thực tế giữa kho và khách hàng
  const distance = calculateDistance(
    startLocation.latitude,
    startLocation.longitude,
    endLocation.latitude,
    endLocation.longitude
  );

  console.log(`Khoảng cách giao hàng: ${distance.toFixed(2)} km`);

  // Tính tổng thời gian giao hàng dựa trên khoảng cách (tốc độ trung bình 15km/h)
  // Trong thực tế, chúng ta sẽ mô phỏng nhanh hơn
  const totalDeliveryTimeMs = Math.max(60000, distance * 4000); // Tối thiểu 1 phút, 4 giây cho mỗi km

  // Phân bổ thời gian cho từng giai đoạn theo tỷ lệ
  const preparationTime = Math.max(15000, distance * 500); // Tối thiểu 15 giây, tăng theo khoảng cách

  // Chia quá trình vận chuyển thành các giai đoạn với thời gian delay dựa trên khoảng cách
  const stages = [
    {
      status: "Đang chuẩn bị hàng",
      delay: preparationTime,
      description: `Đơn hàng đang được chuẩn bị tại kho (${Math.round(
        preparationTime / 1000
      )} giây)`,
    },
    {
      status: "Đã giao cho đơn vị vận chuyển",
      delay: Math.max(10000, distance * 200),
      description: "Đơn hàng đã được bàn giao cho shipper",
    },
    {
      status: "Đang vận chuyển",
      delay: Math.max(15000, distance * 2000), // Phần lớn thời gian là vận chuyển
      description: `Shipper đang trên đường giao hàng (${distance.toFixed(
        1
      )}km)`,
    },
    {
      status: "Gần đến nơi",
      delay: Math.max(10000, distance * 300),
      description: "Shipper sắp đến nơi giao hàng",
    },
    {
      status: "Đã giao hàng",
      delay: 0,
      description: "Đơn hàng đã được giao thành công",
    },
  ];

  // Log thông tin các giai đoạn vận chuyển
  console.log(
    `Thời gian mô phỏng giao hàng: ${(totalDeliveryTimeMs / 1000).toFixed(
      0
    )} giây`
  );
  console.log("Chi tiết thời gian các giai đoạn:");
  stages.forEach((stage) => {
    console.log(`- ${stage.status}: ${(stage.delay / 1000).toFixed(0)} giây`);
  });

  let currentStageIndex = 0;

  const updateShipperLocation = async () => {
    try {
      const shipperInfo = shipperLocations.get(trackingNumber);
      if (!shipperInfo) return; // Nếu không tìm thấy thông tin shipper, dừng quá trình

      const currentStage = stages[currentStageIndex];

      // Cập nhật vị trí shipper (di chuyển dần dần từ kho đến khách hàng)
      if (currentStageIndex >= 1) {
        const progress = currentStageIndex / (stages.length - 1);

        shipperInfo.currentLocation = {
          latitude:
            startLocation.latitude +
            (endLocation.latitude - startLocation.latitude) * progress,
          longitude:
            startLocation.longitude +
            (endLocation.longitude - startLocation.longitude) * progress,
        };
      }

      // Cập nhật trạng thái vận chuyển
      shipperInfo.status = currentStage.status;
      shipperInfo.lastUpdated = new Date();
      shipperLocations.set(trackingNumber, shipperInfo);

      // Tìm đơn hàng và cập nhật
      const order = await Order.findById(shipperInfo.orderId);
      if (order && order.shippingInfo) {
        order.shippingInfo.status = currentStage.status;
        order.shippingInfo.currentLocation = shipperInfo.currentLocation;
        order.shippingInfo.history.push({
          status: currentStage.status,
          timestamp: new Date(),
          description: currentStage.description,
        });

        // Nếu đã giao hàng, cập nhật trạng thái đơn hàng
        if (currentStage.status === "Đã giao hàng") {
          order.status = "Đã giao";

          // Cập nhật trạng thái thanh toán nếu là thanh toán khi nhận hàng
          if (
            order.paymentMethod === "cash" &&
            order.paymentStatus === "Chờ thanh toán"
          ) {
            order.paymentStatus = "Đã thanh toán";
          }
        } else if (currentStage.status === "Đang vận chuyển") {
          order.status = "Đang giao";
        }

        await order.save();

        // Tạo thông báo cho khách hàng
        const notification = new Notification({
          user: shipperInfo.customerId,
          type: "shipping",
          message: `Cập nhật vận chuyển: Đơn hàng #${order.order_code} - ${currentStage.description}`,
          link: `/orders/${order._id}`,
          isRead: false,
        });
        await notification.save();
      }

      currentStageIndex++;

      // Nếu còn giai đoạn tiếp theo, tiếp tục cập nhật
      if (currentStageIndex < stages.length) {
        setTimeout(updateShipperLocation, currentStage.delay);
      }
    } catch (error) {
      console.error(
        `Lỗi khi cập nhật vị trí shipper cho đơn hàng ${trackingNumber}:`,
        error
      );
    }
  };

  // Bắt đầu quá trình cập nhật
  setTimeout(updateShipperLocation, stages[0].delay);
};

// Lấy thông tin vận chuyển theo mã vận đơn
exports.getShipmentByTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const order = await Order.findOne({
      "shippingInfo.trackingNumber": trackingNumber,
    });
    if (!order || !order.shippingInfo) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin vận chuyển với mã vận đơn này",
      });
    }

    return res.status(200).json({
      success: true,
      shipment: order.shippingInfo,
      order: {
        _id: order._id,
        order_code: order.order_code,
        status: order.status,
        customer_id: order.customer_id,
      },
    });
  } catch (error) {
    console.error("Lỗi khi truy vấn thông tin vận chuyển:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi truy vấn thông tin vận chuyển",
      error: error.message,
    });
  }
};

// Lấy vị trí hiện tại của shipper
exports.getShipperLocation = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const shipperInfo = shipperLocations.get(trackingNumber);
    if (!shipperInfo) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin shipper với mã vận đơn này",
      });
    }

    return res.status(200).json({
      success: true,
      location: shipperInfo.currentLocation,
      status: shipperInfo.status,
      lastUpdated: shipperInfo.lastUpdated,
    });
  } catch (error) {
    console.error("Lỗi khi lấy vị trí shipper:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy vị trí shipper",
      error: error.message,
    });
  }
};

// Cập nhật trạng thái vận chuyển thủ công
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { status, description, location } = req.body;

    const order = await Order.findOne({
      "shippingInfo.trackingNumber": trackingNumber,
    });
    if (!order || !order.shippingInfo) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin vận chuyển với mã vận đơn này",
      });
    }

    // Cập nhật trạng thái vận chuyển
    order.shippingInfo.status = status;
    if (location) {
      order.shippingInfo.currentLocation = location;
    }

    // Thêm vào lịch sử vận chuyển
    order.shippingInfo.history.push({
      status,
      timestamp: new Date(),
      description: description || `Cập nhật trạng thái: ${status}`,
    });

    // Cập nhật trạng thái đơn hàng nếu cần
    if (status === "Đã giao hàng") {
      order.status = "Đã giao";

      // Cập nhật trạng thái thanh toán nếu là thanh toán khi nhận hàng
      if (
        order.paymentMethod === "cash" &&
        order.paymentStatus === "Chờ thanh toán"
      ) {
        order.paymentStatus = "Đã thanh toán";
      }
    } else if (status === "Đang vận chuyển") {
      order.status = "Đang giao";
    }

    await order.save();

    // Cập nhật thông tin shipper trong bộ nhớ (nếu có)
    const shipperInfo = shipperLocations.get(trackingNumber);
    if (shipperInfo) {
      shipperInfo.status = status;
      if (location) {
        shipperInfo.currentLocation = location;
      }
      shipperInfo.lastUpdated = new Date();
      shipperLocations.set(trackingNumber, shipperInfo);
    }

    // Tạo thông báo cho khách hàng
    const notification = new Notification({
      user: order.customer_id,
      type: "shipping",
      message: `Cập nhật vận chuyển: Đơn hàng #${order.order_code} - ${
        description || status
      }`,
      link: `/orders/${order._id}`,
      isRead: false,
    });
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái vận chuyển thành công",
      shipment: order.shippingInfo,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái vận chuyển:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái vận chuyển",
      error: error.message,
    });
  }
};
