const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },  // 🔹 Đảm bảo name bắt buộc
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    image: { type: String },
    color: { type: String }  // ✅ Thêm trường color
});

const CartSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [CartItemSchema],  // 🔹 Xác định rõ schema của items
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Cart", CartSchema);
