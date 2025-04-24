
const Favorite = require("../models/Favorite");
const Product = require("../models/Product");
const Category = require("../models/Category");
const mongoose = require("mongoose");

exports.getMostFavoriteProductsByCategory = async (req, res) => {
  try {
    let { limit } = req.query;
    limit = parseInt(limit) || 4;

    // Lấy tất cả category
    const categories = await Category.find();
    let categoryFavorites = {};

    for (const category of categories) {
      const favoriteAggregation = await Favorite.aggregate([
        { $unwind: "$favorites" },
        {
          $lookup: {
            from: "products",
            localField: "favorites",
            foreignField: "_id",
            as: "productData"
          }
        },
        { $unwind: "$productData" },
        { $match: { "productData.category_id": category._id } },
        {
          $group: {
            _id: "$favorites",
            count: { $sum: 1 },
            product: { $first: "$productData" }
          }
        },
        { $sort: { count: -1, "product.createdAt": -1 } }, // Sắp xếp theo số lượt thích và thời gian tạo
        { $limit: limit }
      ]);

      const products = favoriteAggregation.map(item => item.product);
      categoryFavorites[category.name] = products;
    }

    res.status(200).json({ success: true, categoryFavorites });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy sản phẩm yêu thích theo danh mục",
      error: error.message
    });
  }
};




exports.getFavorites = async (req, res) => {
  try {
    const customerId = req.user._id;
    const favorites = await Favorite.findOne({ customer_id: customerId }).populate("favorites");

    if (!favorites) {
      return res.status(200).json({ favorites: [] });
    }

    res.status(200).json({ favorites: favorites.favorites }); // Trả về danh sách sản phẩm đã populate
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách yêu thích", error });
  }
};


//Thêm sản phẩm vào danh sách yêu thích
exports.addFavorite = async (req, res) => {
  try {
    const customerId = req.user._id; // Lấy từ token
    const { productId } = req.body;

    // Chuyển `customerId` thành ObjectId
    const objectIdCustomerId = new mongoose.Types.ObjectId(customerId);
    const objectIdProductId = new mongoose.Types.ObjectId(productId);

    // Kiểm tra sản phẩm có tồn tại không
    const productExists = await Product.findById(objectIdProductId);
    if (!productExists) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Tìm danh sách yêu thích của người dùng
    let favoriteList = await Favorite.findOne({ customer_id: objectIdCustomerId });

    if (!favoriteList) {
      favoriteList = new Favorite({ customer_id: objectIdCustomerId, favorites: [] });
    }

    // Chỉ thêm nếu sản phẩm chưa có trong danh sách
    if (!favoriteList.favorites.some(id => id.equals(objectIdProductId))) {
      favoriteList.favorites.push(objectIdProductId);
      await favoriteList.save();
    }

    res.status(200).json(favoriteList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi thêm vào danh sách yêu thích", error });
  }
};

// Xóa sản phẩm khỏi danh sách yêu thích
exports.removeFavorite = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { productId } = req.body;

    // Chuyển đổi `customer_id` và `productId` sang ObjectId
    const objectIdCustomerId = new mongoose.Types.ObjectId(customerId);
    const objectIdProductId = new mongoose.Types.ObjectId(productId);

    const favoriteList = await Favorite.findOne({ customer_id: objectIdCustomerId });

    if (!favoriteList) {
      return res.status(404).json({ message: "Danh sách yêu thích không tồn tại" });
    }

    // Xóa sản phẩm khỏi danh sách
    favoriteList.favorites = favoriteList.favorites.filter(id => !id.equals(objectIdProductId));
    await favoriteList.save();

    res.status(200).json({ message: "Đã xóa sản phẩm khỏi danh sách yêu thích", favorites: favoriteList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi xóa sản phẩm khỏi danh sách yêu thích", error });
  }
};

