const mongoose = require("mongoose");

// Schema cho lịch sử vận chuyển
const ShippingHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
  },
});

// Schema cho thông tin vận chuyển
const ShippingInfoSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Đang chuẩn bị hàng",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  estimatedDelivery: {
    type: Date,
  },
  distance: {
    type: Number,
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
  },
  customerLocation: {
    latitude: Number,
    longitude: Number,
  },
  history: [ShippingHistorySchema],
});

// Schema cho các mục trong đơn hàng
const OrderItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  color: String,
  variant: {
    material: String,
    price: Number,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

// Schema cho yêu cầu trả hàng/hoàn tiền
const ReturnRequestSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Đang xử lý", "Đã chấp nhận", "Đã từ chối"],
    default: "Đang xử lý",
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
});

const OrderSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shipper_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    order_code: {
      type: String,
      required: true,
    },
    order_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "Đang xử lý",
        "Đã xác nhận",
        "Đang chuẩn bị giao",
        "Đang giao",
        "Đã giao",
        "Đã hoàn thành",
        "Đã hủy",
      ],
      default: "Đang xử lý",
    },
    items: [OrderItemSchema],
    total_price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "payos", "vnpay"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["Chờ thanh toán", "Đã thanh toán", "Thanh toán thất bại"],
      default: "Chờ thanh toán",
    },
    transactionId: String,
    cancelReason: String,
    cancelledBy: String,
    cancelledAt: Date,
    returnRequest: ReturnRequestSchema,
    shippingInfo: ShippingInfoSchema,
    paymentTimeout: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", OrderSchema);
