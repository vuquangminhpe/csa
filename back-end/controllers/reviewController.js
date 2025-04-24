const mongoose = require("mongoose");  // Thêm dòng này vào
const Review = require("../models/Review");
const Order = require("../models/Order");
// Thêm một phương thức mới chỉ lấy các đánh giá công khai (không cần userId)

exports.getPublicReviews = async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 5 } = req.query;

  try {
      // Lấy danh sách các đánh giá công khai theo `product`
      const reviews = await Review.find({ product: productId }) // Thay đổi đúng tên trường
          .limit(parseInt(limit))  
          .skip((parseInt(page) - 1) * parseInt(limit))
          .sort({ createdAt: -1 })
          .populate("user", "name");  // Lấy thêm thông tin tên người dùng

      // Tính tổng số đánh giá
      const totalReviews = await Review.countDocuments({ product: productId });

      // Tính toán thống kê điểm đánh giá
      const ratingStats = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
          { $group: { _id: "$rating", count: { $sum: 1 } } }
      ]);

      const totalRatings = ratingStats.reduce((sum, stat) => sum + stat.count, 0);
      const averageRating = totalRatings > 0 
          ? ratingStats.reduce((sum, stat) => sum + stat._id * stat.count, 0) / totalRatings 
          : 0;

      const stats = {};
      ratingStats.forEach(stat => {
          stats[stat._id] = stat.count;
      });

      res.json({ reviews, totalReviews, averageRating, ratingStats: stats });
  } catch (error) {
      console.error("❌ Lỗi khi tải đánh giá công khai:", error);
      res.status(500).json({ message: "Lỗi khi tải đánh giá công khai" });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Kiểm tra nếu người dùng đã có đánh giá cho sản phẩm này
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này rồi." });
    }

    // Kiểm tra xem người dùng đã mua sản phẩm này chưa
    const hasPurchased = await Order.exists({
      customer_id: userId,
      status: "Đã giao",
      "items.product_id": productId,
    });

    // Tạo review mới
    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
      hasPurchased: !!hasPurchased,
    });
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user ? req.user.id : null;

    console.log("🟢 API getReviewsByProduct gọi thành công. Product ID:", productId);
    console.log("🟡 User ID nhận được:", userId); 

    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .lean();

    console.log("📦 Tất cả đánh giá tìm được:", reviews);

    const ratingStats = {};
    reviews.forEach((rev) => {
      ratingStats[rev.rating] = (ratingStats[rev.rating] || 0) + 1;
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews
        : 0;

    let userReview = null;
    if (userId) {
      userReview = reviews.find((rev) => rev.user._id.toString() === userId);
      console.log("🔍 Review của user đang đăng nhập:", userReview);
    }

    res.json({ reviews, totalReviews, averageRating, ratingStats, userReview });
  } catch (error) {
    console.error("❌ Lỗi trong getReviewsByProduct:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findOneAndUpdate(
      { user: userId, product: productId },
      { 
        rating, 
        comment,
        createdAt: new Date() // Cập nhật lại thời gian tạo khi chỉnh sửa
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá để cập nhật." });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
