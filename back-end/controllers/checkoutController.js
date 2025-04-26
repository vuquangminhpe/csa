const Cart = require("../models/Cart");
const Order = require("../models/Orders");

exports.checkout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, phone, address } = req.body;

    // Lấy giỏ hàng của user
    const cart = await Cart.findOne({ customer_id: userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống!" });
    }

    // Tạo đơn hàng mới
    const order = new Order({
      customer_id: userId,
      items: cart.items,
      fullName,
      phone,
      address,
      total: cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      status: "pending",
    });
    await order.save();

    // Xóa giỏ hàng sau khi đặt hàng
    await Cart.deleteOne({ customer_id: userId });

    res.json({ success: true, message: "Đặt hàng thành công!", order });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đặt hàng", error: error.message });
  }
};
