const Order = require('../models/Order');
const User = require('../models/User'); // Import model User
const Category = require('../models/Category'); // Add this import
const express = require("express");
const payOS = require("../config/payos");
const Product = require('../models/Product');
const Notification = require("../models/Notification");
exports.getAllOrders = async (req, res) => {
  try {
    console.log("Fetching all orders...");

    let orders;
    try {
      orders = await Order.find()
        .populate('customer_id', 'name email phone address')
        .populate('shipper_id', 'name phone')
        .populate({
          path: 'items.product_id',
          select: 'name images brand colors variants category_id'
          // Bỏ populate brand để tránh lỗi

        });

      console.log(`Successfully fetched ${orders.length} orders`);
    } catch (queryError) {
      console.error("Error in database query:", queryError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi truy vấn cơ sở dữ liệu',
        error: queryError.message
      });
    }

    // Kiểm tra nếu không có đơn hàng
    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Không có đơn hàng nào'
      });
    }
    

    // Lấy tất cả danh mục để tìm tên subcategory
    const categories = await Category.find();

    // Định dạng lại dữ liệu với xử lý lỗi tốt hơn
    const formattedOrders = [];

    for (const order of orders) {
      try {
        // Chuyển đổi document Mongoose thành object JavaScript thuần
        const orderObj = order.toObject();

        // Định dạng lại các items trong đơn hàng
        if (orderObj.items && orderObj.items.length > 0) {
          orderObj.items = orderObj.items.map(item => {
            try {
              // Nếu product_id không tồn tại hoặc không có dữ liệu
              if (!item.product_id) {
                return {
                  ...item,
                  name: "Sản phẩm không tồn tại",
                  brand: "Không có thương hiệu",
                  image: "",
                  color: item.color || "Không xác định"
                };
              }

              // Lấy thông tin từ product_id
              const product = item.product_id;

              // Xử lý brand - tìm tên subcategory từ brandId
              let brandName = "Không có thương hiệu";
              const brandId = product.brand ? product.brand.toString() : null;

              if (brandId) {
                // Tìm trong tất cả các danh mục
                for (const category of categories) {
                  // Tìm trong subcategories của mỗi danh mục
                  const subCategory = category.sub_categories.find(
                    sub => sub._id.toString() === brandId || sub._id === brandId
                  );

                  if (subCategory) {
                    brandName = subCategory.name;
                    break;
                  }
                }
              }
              

              const image = product.images && product.images.length > 0 ? product.images[0] : "";

              return {
                ...item,
                name: product.name || "Không có tên sản phẩm",
                brand: brandName,
                image: image,
                color: item.color || (product.colors && product.colors.length > 0 ? product.colors[0] : "Không xác định")
              };
            } catch (itemError) {
              console.error(`Error processing item in order ${order._id}:`, itemError);
              // Trả về item với thông tin tối thiểu để tránh lỗi
              return {
                ...item,
                name: "Lỗi khi xử lý sản phẩm",
                brand: "Không xác định",
                image: "",
                color: "Không xác định"
              };
            }
          });
        }

        formattedOrders.push(orderObj);
      } catch (orderError) {
        console.error(`Error processing order ${order._id}:`, orderError);
        // Bỏ qua đơn hàng lỗi thay vì làm hỏng toàn bộ response
      }
    }

    res.status(200).json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý đơn hàng',
      error: error.message
    });
  }
};

exports.getOrdersByCustomerId = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    console.log(`Lấy đơn hàng cho customer_id: ${customerId}`);

    // Kiểm tra ID hợp lệ
    if (!customerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "ID khách hàng không hợp lệ." });
    }

    // Tìm đơn hàng theo customer_id và populate thông tin User
    const orders = await Order.find({ customer_id: customerId })
      .populate({
        path: 'customer_id',
        select: 'name email phone avatar' // Chỉ lấy các trường cần thiết từ bảng User
      })
      .populate('items.product_id')
      .lean();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng nào cho khách hàng này." });
    }

    // Định dạng lại dữ liệu đơn hàng
    const formattedOrders = orders.map((order) => {
      const formattedItems = order.items.map((item) => {
        const product = item.product_id;
        if (!product) return null;

        const selectedVariant = product.variants
          ? product.variants.find((v) => v.price === item.price)
          : {};

        return {
          _id: item._id,
          product_id: product._id,
          name: product.name,
          brand: product.brand,
          category_id: product.category_id,
          image: product.images.length > 0 ? product.images[0] : '',
          price: item.price,
          quantity: item.quantity,
          color: item.color || product.colors[0],
          variant: selectedVariant || {},
          total: item.quantity * item.price,
        };
      }).filter((item) => item !== null);

      // Chuyển đổi phương thức thanh toán sang tiếng Việt
      let paymentMethodVN = "Tiền mặt (COD)";
      if (order.paymentMethod) {
        switch (order.paymentMethod.toLowerCase()) {
          case 'cash':
            paymentMethodVN = "Tiền mặt (COD)";
            break;
          case 'bank_transfer':
            paymentMethodVN = "Chuyển khoản";
            break;
          case 'payos':
          case 'vnpay':
            paymentMethodVN = "Thanh toán online";
            break;
          default:
            paymentMethodVN = order.paymentMethod;
        }
      }

      return {
        _id: order._id,
        order_code: order.order_code || `OD${String(order._id).slice(-6)}`, // Thêm order_code hoặc tạo mã từ _id
        customer_info: order.customer_id, // Trả về thông tin người dùng đã ánh xạ
        order_date: order.order_date,
        status: order.status,
        total_price: order.total_price,
        discount: order.discount || 0,
        final_price: order.total_price - (order.discount || 0),
        items: formattedItems,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        // Thêm thông tin thanh toán
        paymentStatus: order.paymentStatus || "Chờ thanh toán",
        paymentMethod: paymentMethodVN
      };
    });

    res.status(200).json({ orders: formattedOrders });
  } catch (error) {
    console.error(`Lỗi khi lấy đơn hàng cho customer_id: ${req.params.customerId}`, error);
    res.status(500).json({ message: "Lỗi hệ thống. Vui lòng thử lại." });
  }
};


// ✅ Tạo liên kết thanh toán qua PayOS
exports.createPaymentLink = async (req, res) => {
  const { amount, description, returnUrl, cancelUrl } = req.body;

  // ✅ Tạo mã đơn hàng từ timestamp
  const body = {
    orderCode: Number(String(Date.now()).slice(-6)),
    amount,
    description,
    returnUrl,
    cancelUrl
  };

  try {
    const paymentLinkRes = await payOS.createPaymentLink(body);

    return res.json({
      error: 0,
      message: "Tạo liên kết thanh toán thành công",
      data: {
        checkoutUrl: paymentLinkRes.checkoutUrl,
        amount: paymentLinkRes.amount,
        description: paymentLinkRes.description,
        orderCode: paymentLinkRes.orderCode
      }
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo thanh toán:", error);
    return res.json({
      error: -1,
      message: "Tạo liên kết thanh toán thất bại",
      data: null
    });
  }
};

// Xuất hàm updateProductStock để có thể import từ các file khác
exports.updateProductStock = async function updateProductStock(items) {
  try {
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm với ID: ${item.product_id}`);
      }

      // Debug thông tin
      console.log("Updating stock for:", {
        productId: item.product_id,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant
      });

      // Tìm variant phù hợp dựa trên price
      let variantIndex = -1;
      
      // Nếu có variant và variant có material
      if (item.variant && typeof item.variant === 'object') {
        if (item.variant.material && item.variant.price) {
          variantIndex = product.variants.findIndex(v =>
            v.material === item.variant.material &&
            v.price === parseFloat(item.variant.price)
          );
        } else {
          // Tìm theo price trong variant
          variantIndex = product.variants.findIndex(v => 
            v.price === (item.variant.price ? parseFloat(item.variant.price) : item.price)
          );
        }
      } else {
        // Tìm theo price trực tiếp
        variantIndex = product.variants.findIndex(v => v.price === item.price);
      }

      if (variantIndex === -1) {
        console.error("Không tìm thấy biến thể phù hợp. Chi tiết:", {
          productName: product.name,
          productId: product._id,
          itemPrice: item.price,
          itemVariant: item.variant,
          availableVariants: product.variants.map(v => ({ 
            price: v.price, 
            material: v.material,
            stock: v.stock
          }))
        });
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

// Cập nhật xử lý thanh toán
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    console.log(`Updating payment status for order ${orderId} to ${paymentStatus}`);

    // Sử dụng findOneAndUpdate để cập nhật trạng thái trong một thao tác
    if (paymentStatus === 'Thanh toán thất bại') {
      console.log("Attempting to update order to cancelled due to payment failure");

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            paymentStatus: paymentStatus,
            status: 'Đã hủy',
            cancelReason: 'Thanh toán thất bại',
            cancelledBy: 'Hệ thống',
            cancelledAt: new Date()
          }
        },
        { new: true, runValidators: true }
      ).populate('items.product_id');

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }

      console.log("Order after update:", {
        id: updatedOrder._id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thanh toán thất bại và hủy đơn hàng thành công',
        order: updatedOrder
      });
    }

    // Xử lý các trường hợp khác
    const order = await Order.findById(orderId).populate('items.product_id');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Log thông tin đơn hàng để debug
    console.log("Order details before update:", {
      id: order._id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      currentPaymentStatus: order.paymentStatus
    });

    // Nếu thanh toán thành công
    if (paymentStatus === 'Đã thanh toán') {
      try {
        // Trừ stock sản phẩm
        await exports.updateProductStock(order.items);

        // Cập nhật trạng thái thanh toán
        order.paymentStatus = paymentStatus;
        await order.save();

        res.status(200).json({
          success: true,
          message: 'Cập nhật trạng thái thanh toán và stock thành công',
          order
        });
      } catch (error) {
        console.error("Lỗi khi cập nhật stock:", error);
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    } else if (paymentStatus === 'Thanh toán thất bại') {
      // Tự động chuyển trạng thái đơn hàng sang "Đã hủy" khi thanh toán thất bại
      // Bỏ điều kiện kiểm tra paymentMethod để áp dụng cho mọi phương thức thanh toán
      console.log("Updating order to cancelled due to payment failure");

      order.paymentStatus = paymentStatus;
      order.status = 'Đã hủy';
      order.cancelReason = 'Thanh toán thất bại';
      order.cancelledBy = 'Hệ thống';
      order.cancelledAt = new Date();

      await order.save();

      // Kiểm tra xem đơn hàng đã được cập nhật chưa
      const updatedOrder = await Order.findById(orderId);
      console.log("Order after update:", {
        id: updatedOrder._id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thanh toán thất bại và hủy đơn hàng thành công',
        order: updatedOrder
      });
    } else {
      order.paymentStatus = paymentStatus;
      await order.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thanh toán thành công',
        order
      });
    }
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái thanh toán',
      error: error.message
    });
  }
};

// Thêm hàm mới vào OrderController.js
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, cancelReason, cancelledBy, cancelledAt, shipper_id } = req.body;

    console.log("Update order status request:", {
      orderId,
      status,
      shipper_id
    });

    // Tìm đơn hàng trước khi cập nhật
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Cập nhật trạng thái đơn hàng
    order.status = status;

    // Nếu đơn hàng bị hủy, cập nhật thông tin hủy
    if (status === "Đã hủy") {
      order.cancelReason = cancelReason || "Không có lý do";
      order.cancelledBy = cancelledBy || "Không xác định";
      order.cancelledAt = cancelledAt || new Date();
    }

    // Nếu đơn hàng chuyển sang trạng thái "Đang giao", lưu thông tin shipper
    if (status === "Đang giao" && shipper_id) {
      console.log("Setting shipper_id:", shipper_id);
      order.shipper_id = shipper_id;
    }

    // Nếu đơn hàng đã giao và thanh toán bằng tiền mặt, cập nhật trạng thái thanh toán
    if (status === "Đã giao" && order.paymentMethod === "cash" && order.paymentStatus === "Chờ thanh toán") {
      order.paymentStatus = "Đã thanh toán";
    }

    // Lưu các thay đổi
    await order.save();



    /*  Tạo thông báo khi trạng thái đơn hàng thay đổi Hoàng Gia làm*/
    const allowedStatuses = ["Đang xử lý", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy"];
    if (allowedStatuses.includes(status)) {
      const notification = new Notification({
        user: order.customer_id._id, // Lấy ID khách hàng
        type: "order",
        message: `Đơn hàng ${order.order_code} của bạn "${status}"`,
        link: `/orders/`,
      });
      await notification.save();
    }
    /*  Tạo thông báo khi trạng thái đơn hàng thay đổi Hoàng Gia làm*/


    // Populate thông tin để trả về
    const updatedOrder = await Order.findById(orderId)
      .populate('customer_id', 'name email phone address')
      .populate('shipper_id', 'name phone')
      .populate('items.product_id', 'name');

    console.log("Updated order:", {
      id: updatedOrder._id,
      status: updatedOrder.status,
      shipper_id: updatedOrder.shipper_id
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: updatedOrder
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn hàng',
      error: error.message
    });
  }
};

// Thêm hàm xử lý callback từ PayOS
exports.handlePaymentCallback = async (req, res) => {
  try {
    const { orderCode, status, transactionId } = req.body;
    console.log("Received callback data:", { orderCode, status, transactionId });

    // Tìm đơn hàng dựa trên orderCode
    const order = await Order.findOne({ order_code: orderCode });

    if (!order) {
      console.error(`Không tìm thấy đơn hàng với mã: ${orderCode}`);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    console.log("Found order:", {
      id: order._id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus
    });

    // Xử lý các trạng thái thanh toán từ PayOS
    if (status === 'PAID' || status === 'SUCCESSFUL') {
      // Thanh toán thành công
      order.paymentStatus = 'Đã thanh toán';
      order.transactionId = transactionId;

      // Cập nhật stock sản phẩm
      try {
        await exports.updateProductStock(order.items);
      } catch (error) {
        console.error("Lỗi khi cập nhật stock:", error);
      }
    } else if (status === 'CANCELLED' || status === 'FAILED') {
      // Thanh toán thất bại
      console.log("Payment cancelled or failed, updating order status to cancelled");
      order.paymentStatus = 'Thanh toán thất bại';
      order.status = 'Đã hủy';
      order.cancelReason = 'Thanh toán thất bại';
      order.cancelledBy = 'Hệ thống';
      order.cancelledAt = new Date();
    } else {
      // Các trạng thái khác
      console.log(`Trạng thái thanh toán không xác định: ${status}`);
    }

    // Lưu thay đổi
    await order.save();

    // Kiểm tra lại sau khi lưu
    const updatedOrder = await Order.findById(order._id);
    console.log("Order after update:", {
      id: updatedOrder._id,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      order: updatedOrder
    });
  } catch (error) {
    console.error("Lỗi khi xử lý callback thanh toán:", error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý callback thanh toán',
      error: error.message
    });
  }
};

// Thêm một phương thức để kiểm tra và cập nhật trạng thái đơn hàng
exports.checkAndUpdateOrderStatus = async () => {
  try {
    // Tìm tất cả đơn hàng có trạng thái "Thanh toán thất bại" nhưng chưa được hủy
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

    return { success: true, updatedCount: orders.length };
  } catch (error) {
    console.error("Lỗi khi kiểm tra và cập nhật trạng thái đơn hàng:", error);
    return { success: false, error: error.message };
  }
};

// Thêm một API endpoint để chạy việc kiểm tra và cập nhật thủ công
exports.manualCheckAndUpdate = async (req, res) => {
  try {
    const result = await exports.checkAndUpdateOrderStatus();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra và cập nhật trạng thái đơn hàng',
      error: error.message
    });
  }
};

// Xử lý xác nhận đơn hàng thành công
exports.confirmOrderSuccess = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Kiểm tra xem req.user có tồn tại không
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện hành động này'
      });
    }

    const customerId = req.user._id;
    console.log(`Xác nhận đơn hàng thành công cho orderId: ${orderId}`);

    // Tìm đơn hàng
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    if (order.customer_id.toString() !== customerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status !== "Đã giao") {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xác nhận đơn hàng có trạng thái "Đã giao"'
      });
    }

    // Cập nhật trạng thái đơn hàng thành "Đã hoàn thành"
    order.status = "Đã hoàn thành";
    await order.save();

    // Trả về kết quả
    res.status(200).json({
      success: true,
      message: 'Xác nhận đơn hàng thành công',
      data: order
    });
  } catch (error) {
    console.error("Lỗi khi xác nhận đơn hàng thành công:", error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận đơn hàng thành công',
      error: error.message
    });
  }
};

// Xử lý yêu cầu trả hàng/hoàn tiền
exports.requestOrderReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    // Kiểm tra xem req.user có tồn tại không
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện hành động này'
      });
    }

    const customerId = req.user._id;
    console.log(`Yêu cầu trả hàng cho orderId: ${orderId}, lý do: ${reason}`);

    // Kiểm tra lý do
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do trả hàng'
      });
    }

    // Tìm đơn hàng
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    if (order.customer_id.toString() !== customerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status !== "Đã giao") {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể yêu cầu trả hàng cho đơn hàng có trạng thái "Đã giao"'
      });
    }

    // Cập nhật trạng thái đơn hàng và thêm thông tin trả hàng
    order.returnRequest = {
      reason: reason,
      status: "Đang xử lý",
      requestDate: new Date()
    };

    await order.save();

    // Trả về kết quả
    res.status(200).json({
      success: true,
      message: 'Yêu cầu trả hàng đã được gửi thành công',
      data: order
    });
  } catch (error) {
    console.error("Lỗi khi yêu cầu trả hàng:", error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi yêu cầu trả hàng',
      error: error.message
    });
  }
};

// Tra cứu thông tin bảo hành
exports.checkWarranty = async (req, res) => {
  try {
    const { orderCode, productId } = req.query;
    
    if (!orderCode && !productId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã đơn hàng hoặc mã sản phẩm để tra cứu bảo hành'
      });
    }

    let query = {};
    if (orderCode) {
      query.order_code = orderCode;
    }
    
    // Tìm đơn hàng với thông tin chi tiết hơn
    const orders = await Order.find(query)
      .populate({
        path: 'customer_id',
        select: 'name email phone avatar address'
      })
      .populate({
        path: 'items.product_id',
        select: 'name images brand colors variants category_id description specifications product_code price'
      })
      .lean();
      
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đơn hàng'
      });
    }

    let warrantyInfo = [];
    
    for (const order of orders) {
      if (order.status !== "Đã giao" && order.status !== "Đã hoàn thành") {
        continue;
      }
      
      const orderDate = new Date(order.order_date);
      const warrantyItems = order.items
        .filter(item => !productId || item.product_id._id.toString() === productId)
        .map(item => {
          const product = item.product_id;
          if (!product) return null;

          // Tìm variant được chọn
          const selectedVariant = product.variants
            ? product.variants.find((v) => v.price === item.price)
            : {};

          const warrantyEndDate = new Date(orderDate);
          warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);
          
          const now = new Date();
          const warrantyStatus = now <= warrantyEndDate ? "Còn bảo hành" : "Hết hạn bảo hành";
          const daysLeft = Math.max(0, Math.ceil((warrantyEndDate - now) / (1000 * 60 * 60 * 24)));
          
          return {
            productInfo: {
              _id: product._id,
              name: product.name,
              productCode: product.product_code,
              brand: product.brand,
              category: product.category_id,
              description: product.description,
              specifications: product.specifications,
              images: product.images || [],
              mainImage: product.images && product.images.length > 0 ? product.images[0] : "",
              colors: product.colors || [],
              selectedColor: item.color || (product.colors && product.colors.length > 0 ? product.colors[0] : null),
              variant: selectedVariant || {},
              price: item.price,
              quantity: item.quantity
            },
            orderInfo: {
              _id: order._id,
              orderCode: order.order_code || `OD${String(order._id).slice(-6)}`,
              purchaseDate: orderDate,
              status: order.status,
              paymentStatus: order.paymentStatus || "Chờ thanh toán",
              paymentMethod: order.paymentMethod
            },
            warrantyInfo: {
              status: warrantyStatus,
              startDate: orderDate,
              endDate: warrantyEndDate,
              daysLeft: daysLeft,
              isActive: warrantyStatus === "Còn bảo hành"
            },
            customerInfo: {
              _id: order.customer_id._id,
              name: order.customer_id.name,
              email: order.customer_id.email,
              phone: order.customer_id.phone,
              avatar: order.customer_id.avatar,
              address: order.customer_id.address
            }
          };
        }).filter(item => item !== null);
        
      if (warrantyItems.length > 0) {
        warrantyInfo = [...warrantyInfo, ...warrantyItems];
      }
    }
    
    if (warrantyInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bảo hành cho sản phẩm này'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Tra cứu bảo hành thành công',
      data: warrantyInfo
    });
    
  } catch (error) {
    console.error("Lỗi khi tra cứu bảo hành:", error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tra cứu thông tin bảo hành',
      error: error.message
    });
  }
};

// Tra cứu bảo hành theo mã đơn hàng và số điện thoại (cho khách không đăng nhập)
exports.checkWarrantyPublic = async (req, res) => {
  try {
    const { orderCode, phone } = req.query;
    
    if (!orderCode || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ mã đơn hàng và số điện thoại để tra cứu bảo hành'
      });
    }

    // Tìm khách hàng theo số điện thoại
    const customer = await User.findOne({ phone: phone });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin khách hàng với số điện thoại này'
      });
    }
    
    // Tìm đơn hàng theo mã và khách hàng
    const order = await Order.findOne({
      order_code: orderCode,
      customer_id: customer._id
    }).populate({
      path: 'customer_id',
      select: 'name email phone avatar address'
    }).populate({
      path: 'items.product_id',
      select: 'name images brand colors variants category_id description specifications product_code price'
    }).lean();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng phù hợp với thông tin cung cấp'
      });
    }
    
    // Chỉ xử lý các đơn hàng đã giao hoặc đã hoàn thành
    if (order.status !== "Đã giao" && order.status !== "Đã hoàn thành") {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng chưa được giao hoặc hoàn thành, không thể tra cứu bảo hành'
      });
    }
    
    const orderDate = new Date(order.order_date);
    const warrantyItems = order.items.map(item => {
      const product = item.product_id;
      if (!product) return null;

      // Tìm variant được chọn
      const selectedVariant = product.variants
        ? product.variants.find((v) => v.price === item.price)
        : {};

      const warrantyEndDate = new Date(orderDate);
      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);
      
      const now = new Date();
      const warrantyStatus = now <= warrantyEndDate ? "Còn bảo hành" : "Hết hạn bảo hành";
      const daysLeft = Math.max(0, Math.ceil((warrantyEndDate - now) / (1000 * 60 * 60 * 24)));
      
      return {
        productInfo: {
          _id: product._id,
          name: product.name,
          productCode: product.product_code,
          brand: product.brand,
          category: product.category_id,
          description: product.description,
          specifications: product.specifications,
          images: product.images || [],
          mainImage: product.images && product.images.length > 0 ? product.images[0] : "",
          colors: product.colors || [],
          selectedColor: item.color || (product.colors && product.colors.length > 0 ? product.colors[0] : null),
          variant: selectedVariant || {},
          price: item.price,
          quantity: item.quantity
        },
        orderInfo: {
          _id: order._id,
          orderCode: order.order_code || `OD${String(order._id).slice(-6)}`,
          purchaseDate: orderDate,
          status: order.status,
          paymentStatus: order.paymentStatus || "Chờ thanh toán",
          paymentMethod: order.paymentMethod
        },
        warrantyInfo: {
          status: warrantyStatus,
          startDate: orderDate,
          endDate: warrantyEndDate,
          daysLeft: daysLeft,
          isActive: warrantyStatus === "Còn bảo hành"
        },
        customerInfo: {
          _id: order.customer_id._id,
          name: order.customer_id.name,
          email: order.customer_id.email,
          phone: order.customer_id.phone,
          avatar: order.customer_id.avatar,
          address: order.customer_id.address
        }
      };
    }).filter(item => item !== null);
    
    if (warrantyItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bảo hành cho sản phẩm này'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Tra cứu bảo hành thành công',
      data: warrantyItems
    });
    
  } catch (error) {
    console.error("Lỗi khi tra cứu bảo hành công khai:", error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tra cứu thông tin bảo hành',
      error: error.message
    });
  }
};
