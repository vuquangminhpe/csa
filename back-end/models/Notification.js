const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "shipping",
        "order",
        "payment",
        "system",
        "message",
        "product",
        "dispute",
        "auction",
        "review",
      ],
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Object,
      default: {},
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    relevantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relevantModel: {
      type: String,
      enum: [
        "Order",
        "Product",
        "Payment",
        "Shipping",
        "Dispute",
        "Message",
        "Review",
        "Bid",
        null,
      ],
      default: null,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ user: 1, type: 1 });

NotificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  return this.save();
};

NotificationSchema.statics.getUnreadByUser = function (userId) {
  return this.find({ user: userId, isRead: false }).sort({ createdAt: -1 });
};

NotificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

// Thêm phương thức để tạo thông báo đơn giản
NotificationSchema.statics.createNotification = async function (options) {
  try {
    const notification = new this({
      user: options.userId,
      type: options.type,
      message: options.message,
      link: options.link || null,
      metadata: options.metadata || {},
      sender: options.senderId || null,
      relevantId: options.relevantId || null,
      relevantModel: options.relevantModel || null,
    });

    return await notification.save();
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
