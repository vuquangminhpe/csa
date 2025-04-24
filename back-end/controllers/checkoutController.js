const Cart = require("../models/Cart");
const DiscountCode = require("../models/DiscountCode");
const User = require("../models/User");
const paymentController = require("./paymentController");
const Order = require("../models/Order"); // Đảm bảo bạn đã tạo model Order
const axios = require("axios");
const Product = require("../models/Product");
const { updateProductStock } = require('./OrderController');

exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("name email phone address avatar");
        
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

exports.updateUserInfo = async (req, res) => {
    try {
        const { name, email, phone, address, avatar } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, email, phone, address, avatar },
            { new: true }
        );

        res.status(200).json({ message: "Cập nhật thông tin thành công", user });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};


exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ customer_id: req.user.id })
            .populate({
                path: "items.product_id",
                populate: {
                    path: "category_id",
                    select: "name sub_categories"
                }
            })
            .lean();

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(200).json({ message: "Giỏ hàng trống", items: [] });
        }

        const formattedCart = cart.items.map((item) => {
            const product = item.product_id;
            if (!product) return null;

            // Tìm biến thể phù hợp trong mảng variants
            const selectedVariant = product.variants.find(v => v.price === item.price);

            // Tìm tên sub-category và brand từ category_id
            const category = product.category_id;
            const brandId = product.brand; // Đây là string ID của brand
            const brandInfo = category?.sub_categories?.find(sub => 
                sub._id.toString() === brandId?.toString()
            );

            return {
                product_id: product._id,
                name: product.name,
                brand: brandInfo?.name || "Chưa có thương hiệu",
                price: item.price,
                quantity: item.quantity,
                image: product.images[0],
                color: item.color || (product.colors && product.colors[0]) || "Không xác định",
                variant: selectedVariant || {},
                total: item.price * item.quantity
            };
        }).filter(item => item !== null);

        res.status(200).json({ cart: formattedCart });
    } catch (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};


exports.applyDiscount = async (req, res) => {
    try {
        const { discountCode } = req.body;

        const discount = await DiscountCode.findOne({ code: discountCode.toUpperCase() });

        if (!discount) {
            return res.status(400).json({ message: "Mã giảm giá không hợp lệ" });
        }

        const currentDate = new Date();
        if (currentDate < discount.start_date || currentDate > discount.end_date) {
            return res.status(400).json({ message: "Mã giảm giá đã hết hạn" });
        }

        if (discount.used_count >= discount.usage_limit) {
            return res.status(400).json({ message: "Mã giảm giá đã đạt giới hạn sử dụng" });
        }

        // Lấy giỏ hàng để kiểm tra điều kiện
        const cart = await Cart.findOne({ customer_id: req.user.id });
        if (!cart) {
            return res.status(400).json({ message: "Không tìm thấy giỏ hàng" });
        }

        const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (totalPrice < discount.min_order_value) {
            return res.status(400).json({
                message: `Đơn hàng tối thiểu ${discount.min_order_value.toLocaleString('vi-VN')} VNĐ để áp dụng mã giảm giá này`
            });
        }

        let discountAmount = 0;
        if (discount.discount_type === "percentage") {
            discountAmount = (totalPrice * discount.discount_value) / 100;
            if (discount.max_discount > 0 && discountAmount > discount.max_discount) {
                discountAmount = discount.max_discount;
            }
        } else {
            discountAmount = discount.discount_value;
        }

        res.status(200).json({
            message: "Áp dụng mã giảm giá thành công",
            discount: {
                ...discount.toObject(),
                calculatedAmount: discountAmount
            }
        });
    } catch (error) {
        console.error("Lỗi khi áp dụng mã giảm giá:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};




exports.completeCheckout = async (req, res) => {
    try {
        console.log("Dữ liệu nhận từ frontend:", req.body);

        const { discountCode, paymentMethod } = req.body;

        if (!paymentMethod) {
            return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
        }

        // Tìm giỏ hàng của người dùng
        const cart = await Cart.findOne({ customer_id: req.user.id })
            .populate({
                path: "items.product_id",
                select: "name price variants colors images category_id brand",
                populate: {
                    path: "category_id",
                    select: "name sub_categories"
                }
            })
            .lean();

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống" });
        }

        // Kiểm tra số lượng tồn kho trước khi tạo đơn hàng
        for (const item of cart.items) {
            const product = item.product_id;
            const selectedVariant = product.variants.find(v => v.price === item.price);
            
            if (!selectedVariant) {
                return res.status(400).json({ 
                    message: `Không tìm thấy biến thể phù hợp cho sản phẩm ${product.name}` 
                });
            }

            if (selectedVariant.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Sản phẩm ${product.name} chỉ còn ${selectedVariant.stock} sản phẩm trong kho. Bạn đã chọn ${item.quantity} sản phẩm.` 
                });
            }
        }

        // Tính tổng giá trị đơn hàng
        let totalPrice = cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        let discount = 0;

        // Áp dụng mã giảm giá nếu có
        if (discountCode) {
            const discountData = await DiscountCode.findOne({
                code: discountCode.toUpperCase(),
            });

            if (discountData) {
                // Kiểm tra điều kiện áp dụng mã giảm giá
                if (totalPrice < discountData.min_order_value) {
                    return res.status(400).json({
                        message: `Đơn hàng tối thiểu ${discountData.min_order_value.toLocaleString('vi-VN')} VNĐ để áp dụng mã giảm giá này`
                    });
                }

                if (discountData.discount_type === "percentage") {
                    discount = (totalPrice * discountData.discount_value) / 100;
                    if (discountData.max_discount > 0 && discount > discountData.max_discount) {
                        discount = discountData.max_discount;
                    }
                } else {
                    discount = discountData.discount_value;
                }

                await DiscountCode.findByIdAndUpdate(discountData._id, {
                    $inc: { used_count: 1 }
                });
            }
        }

        const finalAmount = totalPrice - discount;

        //Chuẩn bị dữ liệu đơn hàng
        const orderItems = cart.items.map((item) => {
            const product = item.product_id;
            
            // Tìm variant phù hợp dựa trên giá
            const selectedVariant = product.variants.find(v => v.price === item.price);
            if (!selectedVariant) {
                throw new Error(`Không tìm thấy biến thể phù hợp cho sản phẩm ${product.name}`);
            }

            // Debug thông tin variant
            console.log("Selected variant:", {
                productName: product.name,
                price: item.price,
                variant: selectedVariant
            });
            
            // Kiểm tra và lấy màu sắc
            if (!item.color && (!product.colors || !Array.isArray(product.colors) || product.colors.length === 0)) {
                throw new Error(`Sản phẩm ${product.name} không có thông tin màu sắc`);
            }
            const itemColor = item.color || product.colors[0];
            
            return {
                product_id: product._id,
                color: itemColor,
                variant: {
                    material: selectedVariant.material,
                    price: selectedVariant.price
                },
                quantity: item.quantity,
                price: item.price,
            };
        });

        //Xử lý thanh toán tiền mặt (COD)
        if (paymentMethod === "cash") {
            const newOrder = new Order({
                customer_id: req.user.id,
                order_code: Math.floor(Math.random() * 1000000).toString(),
                total_price: totalPrice,
                discount,
                paymentMethod,
                paymentStatus: "Chờ thanh toán",
                status: "Đang xử lý",
                items: orderItems,
            });

            await newOrder.save();

            // Cập nhật trạng thái thanh toán và trừ stock ngay lập tức cho COD
            try {
                await updateProductStock(orderItems);
                console.log("Đã cập nhật stock thành công cho COD");
            } catch (error) {
                console.error("Lỗi khi cập nhật stock:", error);
                // Nếu lỗi, xóa đơn hàng đã tạo
                await Order.findByIdAndDelete(newOrder._id);
                return res.status(400).json({ message: error.message });
            }

            // Populate thông tin sản phẩm trước khi trả về
            const populatedOrder = await Order.findById(newOrder._id)
                .populate('items.product_id', 'name images')
                .lean();

            // Xóa giỏ hàng sau khi thanh toán thành công
            await Cart.findOneAndDelete({ customer_id: req.user.id });

            return res.status(200).json({
                message: "Đơn hàng được thanh toán thành công bằng tiền mặt",
                order: populatedOrder,
            });
        }

        // Xử lý thanh toán chuyển khoản qua PayOS
        if (paymentMethod === "bank_transfer") {
            // Tạo orderId là số nguyên 6 chữ số
            const orderId = Math.floor(100000 + Math.random() * 900000);
            console.log("Generated orderId:", orderId);

            // Tạo đơn hàng mới trong trạng thái "Chờ thanh toán"
            const newOrder = new Order({
                customer_id: req.user.id,
                order_code: orderId.toString(),
                total_price: totalPrice,
                discount,
                paymentMethod,
                paymentStatus: "Chờ thanh toán",
                status: "Đang xử lý",
                items: orderItems,
            });

            await newOrder.save();
            console.log("Created new order:", newOrder);

            // Tạo liên kết thanh toán qua PayOS
            const paymentResponse = await axios.post(
                "http://localhost:9999/api/payment/create-payment",
                {
                    totalAmount: finalAmount,
                    orderId: orderId,
                    description: "Thanh toán đơn hàng",
                }
            );

            if (!paymentResponse.data || !paymentResponse.data.paymentUrl) {
                return res.status(500).json({ message: "Không thể tạo thanh toán qua PayOS" });
            }

            // Cập nhật order_code mới và lưu URL thanh toán
            if (paymentResponse.data.orderCode) {
                await Order.findOneAndUpdate(
                    { _id: newOrder._id },
                    { 
                        order_code: paymentResponse.data.orderCode,
                        transactionId: paymentResponse.data.paymentUrl
                    }
                );
            }

            return res.status(200).json({
                message: "Chuyển hướng đến thanh toán qua PayOS",
                paymentUrl: paymentResponse.data.paymentUrl,
            });
        }

    } catch (error) {
        console.error("Lỗi khi hoàn tất đơn hàng:", error);
        res.status(500).json({ message: "Lỗi hệ thống. Vui lòng thử lại." });
    }
};
  