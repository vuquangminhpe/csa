const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Categories");

// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .select('title price images')
            .sort({ createdAt: -1 });

        const formattedProducts = products.map(product => ({
            _id: product._id,
            name: product.title,
            price: product.price,
            images: product.images
        }));

        res.json({
            products: formattedProducts
        });
    } catch (error) {
        console.error("Error in getAllProducts:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách sản phẩm",
            error: error.message
        });
    }
};

// Lấy sản phẩm theo ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("categoryId", "name") // Lấy tên danh mục
            .populate("sellerId", "username email"); // Lấy thông tin người bán

        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error("Error in getProductById:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy sản phẩm",
            error: error.message,
        });
    }
};

// Thêm sản phẩm mới
const createProduct = async (req, res) => {
    try {
        const { title, description, price, categoryId, sellerId, isAuction, auctionEndTime } = req.body;

        if (!title || !description || !price || !categoryId || !sellerId) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin sản phẩm" });
        }

        let images = [];
        if (req.files) {
            images = req.files.map(file => file.path.replace(/\\/g, "/"));
        }

        const newProduct = new Product({
            title,
            description,
            price,
            images,
            categoryId,
            sellerId,
            isAuction: isAuction || false,
            auctionEndTime: isAuction ? auctionEndTime : null,
        });

        const savedProduct = await newProduct.save();
        res.status(201).json({
            success: true,
            message: "Sản phẩm đã được tạo thành công",
            product: savedProduct,
        });
    } catch (error) {
        console.error("Error in createProduct:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo sản phẩm",
            error: error.message,
        });
    }
};

// Cập nhật sản phẩm theo ID
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, categoryId, isAuction, auctionEndTime } = req.body;

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        let images = [...existingProduct.images];
        if (req.files) {
            images = req.files.map(file => file.path.replace(/\\/g, "/"));
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                title,
                description,
                price,
                images,
                categoryId,
                isAuction: isAuction || false,
                auctionEndTime: isAuction ? auctionEndTime : null,
            },
            { new: true }
        );

        res.json({
            success: true,
            message: "Sản phẩm đã được cập nhật thành công",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Error in updateProduct:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật sản phẩm",
            error: error.message,
        });
    }
};

// Xóa sản phẩm theo ID
const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        res.status(200).json({ message: "Sản phẩm đã được xóa" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa sản phẩm", error: error.message });
    }
};

// Lấy sản phẩm theo danh mục
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Danh mục không tồn tại" });
        }

        const products = await Product.find({ categoryId }).populate("categoryId", "name");

        res.status(200).json({
            category,
            products,
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy sản phẩm theo danh mục", error: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
};
