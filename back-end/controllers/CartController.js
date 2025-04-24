const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Lấy giỏ hàng của người dùng
exports.getCart = async (req, res) => {
    try {
        console.log(`📌 Nhận request lấy giỏ hàng từ user_id: ${req.user.id}`);

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
            console.warn(`⚠️ [Warning] Giỏ hàng trống cho user_id: ${req.user.id}`);
            return res.status(200).json({ message: "Giỏ hàng trống", items: [] });
        }

        // 🔹 Map qua từng sản phẩm trong giỏ hàng để lấy đúng biến thể đã chọn
        const formattedCart = cart.items.map((item) => {
            const product = item.product_id;
            if (!product) return null;

            // 🔍 Tìm biến thể phù hợp trong mảng variants
            const selectedVariant = product.variants.find(v => v.price === item.price);

            // 🔍 Tìm tên sub-category và brand từ category_id
            const category = product.category_id;
            const brandId = product.brand; // Đây là string ID của brand
            const brandInfo = category?.sub_categories?.find(sub => 
                sub._id.toString() === brandId?.toString()
            );

            return {
                _id: item._id,
                product_id: product._id,
                name: product.name,
                brand: brandInfo?.name || "Chưa có thương hiệu",
                category_name: category?.name || "Không xác định",
                image: product.images.length > 0 ? product.images[0] : "",
                price: item.price,
                quantity: item.quantity,
                color: item.color || product.colors[0],
                variant: selectedVariant || {},
                total: item.quantity * item.price
            };
        }).filter(item => item !== null);

        res.status(200).json({ items: formattedCart });
    } catch (error) {
        console.error(`❌ [Error] Lỗi khi lấy giỏ hàng cho user_id: ${req.user.id}`, error);
        res.status(500).json({ message: "Lỗi hệ thống. Vui lòng thử lại." });
    }
};




// Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
    try {
        const { product_id, quantity, variant_index, selected_color } = req.body;
        const product = await Product.findById(product_id);

        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        if (!product.variants || product.variants.length === 0) {
            return res.status(400).json({ message: "Sản phẩm không có biến thể" });
        }

        const variant = product.variants[variant_index || 0]; // Lấy đúng biến thể

        if (!variant) {
            return res.status(400).json({ message: "Biến thể sản phẩm không hợp lệ" });
        }

        let cart = await Cart.findOne({ customer_id: req.user.id });

        if (!cart) {
            cart = new Cart({ customer_id: req.user.id, items: [] });
        }

        // 🔥 Kiểm tra xem có sản phẩm nào không có name không
        cart.items = cart.items.map(item => {
            if (!item.name) {
                item.name = "Unknown"; // Cách khắc phục tạm thời nếu dữ liệu bị lỗi
            }
            return item;
        });

        // Sử dụng màu sắc được chọn hoặc màu mặc định
        const color = selected_color || (product.colors && product.colors.length > 0 ? product.colors[0] : null);

        const existingItem = cart.items.find(item => 
            item.product_id.equals(product_id) && 
            item.price === variant.price && 
            item.color === color
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            const cartItem = {
                product_id: product._id,
                name: product.name,  // ✅ Chắc chắn `name` có dữ liệu
                price: variant.price,
                quantity: quantity || 1,
                image: product.images.length > 0 ? product.images[0] : "",
                color: color  // ✅ Lưu màu sắc được chọn
            };

            cart.items.push(cartItem);
        }

        await cart.save();
        res.json({ message: "Sản phẩm đã được thêm vào giỏ hàng", cart });
    } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        res.status(500).json({ message: error.message });
    }
};






// Cập nhật số lượng sản phẩm trong giỏ hàng
exports.updateCartItem = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        let cart = await Cart.findOne({ customer_id: req.user.id });

        if (!cart) return res.status(404).json({ message: "Giỏ hàng không tồn tại" });

        // Tìm sản phẩm trong giỏ hàng
        const itemIndex = cart.items.findIndex(item => item.product_id.equals(product_id));
        if (itemIndex === -1) return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });

        // Lấy thông tin sản phẩm từ database
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        // Tìm variant phù hợp dựa trên giá
        const variant = product.variants.find(v => v.price === cart.items[itemIndex].price);
        if (!variant) {
            return res.status(404).json({ message: "Không tìm thấy biến thể sản phẩm" });
        }

        // Kiểm tra số lượng tồn kho
        if (quantity > variant.stock) {
            return res.status(400).json({ 
                message: `Số lượng yêu cầu (${quantity}) vượt quá số lượng trong kho (${variant.stock})`,
                availableStock: variant.stock
            });
        }

        if (quantity <= 0) {
            // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
            cart.items.splice(itemIndex, 1);
        } else {
            // Cập nhật số lượng sản phẩm
            cart.items[itemIndex].quantity = quantity;
        }

        cart.updatedAt = Date.now();
        await cart.save();

        res.json({ 
            message: "Cập nhật giỏ hàng thành công", 
            cart,
            availableStock: variant.stock 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
    try {
        const { product_id, item_id } = req.body;
        console.log("Removing item:", { product_id, item_id });
        
        let cart = await Cart.findOne({ customer_id: req.user.id });
        if (!cart) return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
        
        const initialLength = cart.items.length;
        let itemRemoved = false;

        // Nếu có item_id, xóa theo item_id (chính xác một biến thể)
        if (item_id) {
            cart.items = cart.items.filter(item => {
                if (item._id.toString() === item_id) {
                    itemRemoved = true;
                    return false;
                }
                return true;
            });
        } else {
            // Nếu chỉ có product_id, xóa tất cả các biến thể của sản phẩm đó
            cart.items = cart.items.filter(item => {
                if (item.product_id.equals(product_id)) {
                    itemRemoved = true;
                    return false;
                }
                return true;
            });
        }

        if (!itemRemoved) {
            return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
        }

        cart.updatedAt = Date.now();
        await cart.save();
        
        res.json({ message: "Sản phẩm đã được xóa khỏi giỏ hàng", cart });
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).json({ message: error.message });
    }
};
