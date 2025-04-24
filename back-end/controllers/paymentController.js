const payOS = require("../config/payos");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
// Import hàm updateProductStock từ OrderController
const { updateProductStock } = require('./OrderController');

exports.createPayment = async (req, res) => {
    try {
        const { totalAmount, orderId } = req.body;
        console.log("Creating payment for orderId:", orderId);

        const description = "Thanh toán đơn hàng";

        // Đảm bảo orderId là số
        const orderIdNumber = parseInt(orderId);
        if (isNaN(orderIdNumber)) {
            throw new Error("OrderId phải là số");
        }

        // Tạo payment link từ PayOS
        const paymentData = await payOS.createPaymentLink({
            orderCode: orderIdNumber, // Gửi dạng số
            amount: parseInt(totalAmount), // Đảm bảo amount cũng là số
            description: description,
            returnUrl: process.env.PAYOS_RETURN_URL,
            cancelUrl: process.env.PAYOS_CANCEL_URL
        });

        // Lấy orderCode từ PayOS response
        const payosOrderCode = paymentData.orderCode;
        console.log("PayOS orderCode:", payosOrderCode);

        // Cập nhật order_code mới từ PayOS vào đơn hàng
        await Order.findOneAndUpdate(
            { order_code: orderId.toString() },
            {
                order_code: payosOrderCode.toString(),
                transactionId: paymentData.checkoutUrl // Lưu URL thanh toán vào transactionId
            }
        );

        return res.status(200).json({
            paymentUrl: paymentData.checkoutUrl,
            orderCode: payosOrderCode.toString()
        });
    } catch (error) {
        console.error("Lỗi khi tạo thanh toán:", error);
        return res.status(500).json({ message: "Lỗi khi tạo thanh toán qua PayOS" });
    }
};


// Xử lý webhook từ PayOS
exports.handleWebhook = async (req, res) => {
    console.log("Webhook được nhận từ PayOS");
    const webhookData = payOS.verifyPaymentWebhookData(req.body);

    if (webhookData.status === "PAID") {
        console.log("Thanh toán thành công", webhookData);

        // Cập nhật trạng thái đơn hàng tại đây (có thể thêm logic lưu đơn hàng vào MongoDB)
        return res.json({
            error: -1,
            message: "Dữ liệu không hợp lệ từ webhook",
            data: null
        });
    };

    // Hàm cập nhật stock
    async function updateProductStock(items) {
        try {
            for (const item of items) {
                const product = await Product.findById(item.product_id);
                if (!product) {
                    throw new Error(`Không tìm thấy sản phẩm với ID: ${item.product_id}`);
                }

                // Tìm variant phù hợp dựa trên giá
                const variantIndex = product.variants.findIndex(v => v.price === item.price);

                if (variantIndex === -1) {
                    throw new Error(`Không tìm thấy biến thể phù hợp cho sản phẩm ${product.name}`);
                }

                // Kiểm tra số lượng tồn kho
                if (product.variants[variantIndex].stock < item.quantity) {
                    throw new Error(`Sản phẩm ${product.name} không đủ số lượng trong kho`);
                }

                // Cập nhật số lượng trong kho
                const newStock = product.variants[variantIndex].stock - item.quantity;

                console.log("Stock update:", {
                    productName: product.name,
                    oldStock: product.variants[variantIndex].stock,
                    deduction: item.quantity,
                    newStock: newStock
                });

                // Lưu thay đổi vào database
                await Product.findByIdAndUpdate(
                    item.product_id,
                    {
                        $set: {
                            [`variants.${variantIndex}.stock`]: newStock
                        }
                    }
                );
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật stock:", error);
            throw error;
        }
    }
}
exports.handlePayOSCallback = async (req, res) => {
    try {
        const { orderCode, status, transactionId } = req.body;
        console.log("Received callback data:", req.body);

        if (!orderCode) {
            return res.status(400).json({
                message: "Thiếu mã đơn hàng"
            });
        }

        let paymentStatus;
        let orderStatus;

        switch (status) {
            case "PAID":
                paymentStatus = "Đã thanh toán";
                orderStatus = "Đã xác nhận";
                break;
            case "CANCELLED":
            case "FAILED":
                paymentStatus = "Thanh toán thất bại";
                orderStatus = "Đã hủy";
                break;
            default:
                paymentStatus = "Chờ thanh toán";
                orderStatus = "Đang xử lý";
        }

        // Tìm đơn hàng và populate items
        const order = await Order.findOne({ order_code: orderCode })
            .populate('items.product_id');

        if (!order) {
            console.log("Không tìm thấy đơn hàng:", orderCode);
            return res.status(404).json({
                message: "Không tìm thấy đơn hàng"
            });
        }

        // Nếu thanh toán thành công
        if (status === "PAID") {
            try {
                // Cập nhật stock
                await updateProductStock(order.items);
                console.log("Đã cập nhật stock thành công cho PayOS payment");

                // Xóa giỏ hàng
                await Cart.findOneAndDelete({ customer_id: order.customer_id });



                // 📢 **Tạo thông báo cho khách hàng Hoàng Gia làm**
                console.log("📢 Đang tạo thông báo thanh toán cho khách hàng:", order.customer_id._id);

                const notification = new Notification({
                    user: order.customer_id._id, // ID khách hàng nhận thông báo
                    type: "transaction",
                    message: `Đơn hàng ${order.order_code} của bạn đã được thanh toán với số tiền ${order.total_price.toLocaleString('vi-VN')} VNĐ qua VietQR.`,
                    link: `/order/${order._id}`,
                });
                await notification.save();
                console.log("✅ Thông báo thanh toán đã được tạo thành công.");
                // 📢 **Tạo thông báo cho khách hàng Hoàng Gia làm**




            } catch (error) {
                console.error("Lỗi khi xử lý thanh toán thành công:", error);
                return res.status(500).json({
                    message: "Lỗi khi cập nhật stock",
                    error: error.message
                });
            }
        }

        // Cập nhật trạng thái đơn hàng
        order.paymentStatus = paymentStatus;
        order.status = orderStatus;
        order.transactionId = transactionId || null;
        order.updatedAt = Date.now();
        await order.save();

        return res.status(200).json({
            message: `Cập nhật trạng thái thanh toán thành công: ${paymentStatus}`,
            order
        });

    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
        return res.status(500).json({
            message: "Lỗi hệ thống khi cập nhật trạng thái thanh toán",
            error: error.message
        });
    }
};

exports.fixFailedPaymentOrders = async (req, res) => {
    try {
        // Tìm tất cả đơn hàng có trạng thái thanh toán thất bại nhưng chưa được hủy
        const orders = await Order.find({
            paymentStatus: 'Thanh toán thất bại',
            status: { $ne: 'Đã hủy' }
        });

        console.log(`Found ${orders.length} orders with failed payment but not cancelled`);

        for (const order of orders) {
            console.log(`Updating order ${order._id} to cancelled status`);

            order.status = 'Đã hủy';
            order.cancelReason = 'Thanh toán thất bại';
            order.cancelledBy = 'Hệ thống';
            order.cancelledAt = new Date();

            await order.save();
        }

        return res.status(200).json({
            success: true,
            message: `Đã cập nhật ${orders.length} đơn hàng có thanh toán thất bại thành trạng thái đã hủy`,
            updatedCount: orders.length
        });
    } catch (error) {
        console.error("Lỗi khi sửa trạng thái đơn hàng:", error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi sửa trạng thái đơn hàng',
            error: error.message
        });
    }
};

// Thêm hàm mới để lấy link thanh toán cho đơn hàng
exports.getPaymentLink = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({ message: "Thiếu mã đơn hàng" });
        }

        // Tìm đơn hàng theo order_code
        const order = await Order.findOne({
            order_code: orderId,
            paymentMethod: "bank_transfer",
            paymentStatus: "Chờ thanh toán"
        });

        if (!order) {
            return res.status(404).json({
                message: "Không tìm thấy đơn hàng hoặc đơn hàng không phải thanh toán chuyển khoản"
            });
        }

        // Kiểm tra xem có link thanh toán không
        if (!order.transactionId) {
            return res.status(404).json({
                message: "Không tìm thấy link thanh toán cho đơn hàng này"
            });
        }

        return res.status(200).json({
            message: "Lấy link thanh toán thành công",
            paymentUrl: order.transactionId,
            order: {
                orderId: order.order_code,
                totalAmount: order.total_price - order.discount,
                status: order.status,
                paymentStatus: order.paymentStatus
            }
        });

    } catch (error) {
        console.error("Lỗi khi lấy link thanh toán:", error);
        return res.status(500).json({
            message: "Lỗi hệ thống khi lấy link thanh toán",
            error: error.message
        });
    }
};

