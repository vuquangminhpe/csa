const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");


const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Đếm tổng số sản phẩm
        const totalProducts = await Product.countDocuments();

        // Lấy sản phẩm theo phân trang
        const products = await Product.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo mới nhất

        res.json({
            success: true,
            products,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts
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



const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy sản phẩm", error: error.message });
    }
};
// Thêm sản phẩm mới
const createProduct = async (req, res) => {
    try {
        console.log("Files received:", req.files);
        console.log("Body received:", req.body);

        const { name, category_id, description, brand } = req.body;
        let colors = [];
        let variants = [];

        // Parse colors - Cải thiện xử lý màu sắc
        try {
            if (req.body.colors) {
                colors = JSON.parse(req.body.colors);
                if (!Array.isArray(colors)) {
                    colors = [req.body.colors]; // Nếu không phải mảng, chuyển thành mảng đơn phần tử
                }
            } else if (req.body.color) {
                // Hỗ trợ tương thích ngược với trường color cũ
                if (typeof req.body.color === 'string') {
                    try {
                        const parsed = JSON.parse(req.body.color);
                        colors = Array.isArray(parsed) ? parsed : [req.body.color];
                    } catch (e) {
                        colors = [req.body.color];
                    }
                } else {
                    colors = Array.isArray(req.body.color) ? req.body.color : [req.body.color];
                }
            }
        } catch (error) {
            console.error("Error parsing colors:", error);
            colors = []; // Nếu parse lỗi, coi như là mảng rỗng
        }

        // Parse variants
        try {
            if (req.body.variants) {
                variants = JSON.parse(req.body.variants);
                // Validate variants structure
                if (!Array.isArray(variants)) {
                    throw new Error("Variants must be an array");
                }

                // Chuyển đổi price và stock sang Number
                variants = variants.map(variant => ({
                    ...variant,
                    price: Number(variant.price),
                    stock: Number(variant.stock)
                }));
            }
        } catch (error) {
            console.error("Error parsing variants:", error);
            return res.status(400).json({
                success: false,
                message: "Lỗi khi xử lý dữ liệu variants",
                error: error.message
            });
        }

        // Validate required fields
        if (!name || !category_id || !description || !brand || colors.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin sản phẩm"
            });
        }

        // Xử lý images
        let images = [];
        if (req.files) {
            if (req.files.mainImage) {
                images.push(req.files.mainImage[0].path.replace(/\\/g, '/'));
            }
            if (req.files.additionalImages) {
                images = images.concat(
                    req.files.additionalImages.map(file => file.path.replace(/\\/g, '/'))
                );
            }
        }

        // Create new product
        const newProduct = new Product({
            name,
            category_id,
            description,
            brand,
            colors,  // Lưu dưới dạng mảng colors
            images,
            variants
        });

        // Log để debug
        console.log("Product being saved:", {
            name,
            category_id,
            description,
            brand,
            colors,
            images,
            variants
        });

        const savedProduct = await newProduct.save();
        console.log("Saved product:", savedProduct);

        res.status(201).json({
            success: true,
            message: "Sản phẩm đã được tạo thành công",
            product: savedProduct
        });
    } catch (error) {
        console.error("Error in createProduct:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo sản phẩm",
            error: error.message
        });
    }
};



// Cập nhật sản phẩm theo ID
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category_id, description, brand } = req.body;
        let colors = [];
        let variants = [];

        // Parse colors
        try {
            if (req.body.colors) {
                colors = JSON.parse(req.body.colors);
                if (!Array.isArray(colors)) {
                    colors = [req.body.colors]; // Nếu không phải mảng, chuyển thành mảng đơn phần tử
                }
            } else if (req.body.color) {
                // Hỗ trợ tương thích ngược với trường color cũ
                if (typeof req.body.color === 'string') {
                    try {
                        const parsed = JSON.parse(req.body.color);
                        colors = Array.isArray(parsed) ? parsed : [req.body.color];
                    } catch (e) {
                        colors = [req.body.color];
                    }
                } else {
                    colors = Array.isArray(req.body.color) ? req.body.color : [req.body.color];
                }
            }
        } catch (error) {
            console.error("Error parsing colors:", error);
            colors = []; // Nếu parse lỗi, coi như là mảng rỗng
        }

        // Parse variants
        try {
            if (req.body.variants) {
                variants = JSON.parse(req.body.variants);
                variants = variants.map(variant => ({
                    ...variant,
                    price: Number(variant.price),
                    stock: Number(variant.stock)
                }));
            }
        } catch (error) {
            console.error("Error parsing variants:", error);
            return res.status(400).json({
                success: false,
                message: "Lỗi khi xử lý dữ liệu variants",
                error: error.message
            });
        }

        // Xử lý images
        let images = [];
        const existingProduct = await Product.findById(id);
        
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }

        // Validate required fields
        if (!name || !category_id || !description || !brand || colors.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin sản phẩm"
            });
        }

        // Giữ lại ảnh cũ nếu không có ảnh mới
        images = [...existingProduct.images];

        if (req.files) {
            if (req.files.mainImage) {
                // Thay thế ảnh chính
                images[0] = req.files.mainImage[0].path.replace(/\\/g, '/');
            }
            if (req.files.additionalImages) {
                // Thêm ảnh phụ mới
                const newAdditionalImages = req.files.additionalImages.map(
                    file => file.path.replace(/\\/g, '/')
                );
                images = [images[0], ...newAdditionalImages];
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                name,
                category_id,
                description,
                brand,
                colors,  // Lưu dưới dạng mảng colors
                images,
                variants
            },
            { new: true }
        );

        res.json({
            success: true,
            message: "Sản phẩm đã được cập nhật thành công",
            product: updatedProduct
        });
    } catch (error) {
        console.error("Error in updateProduct:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật sản phẩm",
            error: error.message
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


// API: Lấy tất cả sản phẩm theo danh mục chính
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Tìm danh mục chính
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Danh mục không tồn tại" });
        }

        // Lấy tất cả sản phẩm thuộc danh mục này
        const products = await Product.find({ category_id: categoryId });

        res.status(200).json({
            category,
            products
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy sản phẩm theo danh mục", error: error.message });
    }
};

// API: Lấy sản phẩm theo danh mục con (lọc theo thương hiệu)
const getProductsByBrand = async (req, res) => {
    try {
        const { categoryId, brand } = req.params;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Danh mục không tồn tại" });
        }
        const subCategoryExists = category.sub_categories.some(sub => sub._id.toString() === brand);
        if (!subCategoryExists) {
            return res.status(404).json({ message: "Thương hiệu không tồn tại trong danh mục này" });
        }

        const products = await Product.find({
            category_id: categoryId,
            brand: brand,
        });
        
        res.status(200).json({
            categoryId,
            brand,
            products
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy sản phẩm theo thương hiệu", error: error.message });
    }

    //     try {
    //         const { categoryId, brand } = req.params;
    //         const category = await Category.findById(categoryId);
    //         if (!category) {
    //             return res.status(404).json({ message: "Danh mục không tồn tại" });
    //         }
    //         const subCategoryExists = category.sub_categories.some(
    //           sub => sub._id.toString() === brand
    //         );
    //         if (!subCategoryExists) {
    //             return res.status(404).json({ message: "Thương hiệu không tồn tại trong danh mục này" });
    //         }
    
    //         const products = await Product.find({
    //             category_id: categoryId,
    //             brand: brand,
    //         });
            
    //         res.status(200).json({
    //             categoryId,
    //             brand,
    //             products
    //         });
    //     } catch (error) {
    //         res.status(500).json({ message: "Lỗi khi lấy sản phẩm theo thương hiệu", error: error.message });
    //     }
    // };
};


const getProductImage = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product || !product.images || product.images.length === 0) {
        return res.status(404).json({ message: "Image not found" });
      }
      // Giả sử ảnh chính nằm ở vị trí đầu tiên của mảng images
      const imagePath = path.join(__dirname, "../uploads", product.images[0]);
      return res.sendFile(imagePath);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving image", error: error.message });
    }
  };

const filterProduct = async (req, res) => {
    try {
        let { name, category, brand, stockStatus, sortByPrice, minPrice, maxPrice, ...variants } = req.query;
        let filter = {};

        // Thêm điều kiện tìm kiếm theo tên
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.category_id = new mongoose.Types.ObjectId(category);
            } else {
                return res.status(400).json({ success: false, message: "Category ID không hợp lệ" });
            }
        }
        if (brand) {
            if (mongoose.Types.ObjectId.isValid(brand)) {
                filter.brand = new mongoose.Types.ObjectId(brand);
            } else {
                return res.status(400).json({ success: false, message: "Brand ID không hợp lệ" });
            }
        }
        if (stockStatus) {
            if (stockStatus === "inStock") {
                filter["variants.stock"] = { $gt: 0 }; 
            } else if (stockStatus === "outOfStock") {
                filter["variants.stock"] = 0;
            }
        }
        if (minPrice || maxPrice) {
            filter["variants.price"] = {};
            if (minPrice) {
                filter["variants.price"].$gte = Number(minPrice); 
            }
            if (maxPrice) {
                filter["variants.price"].$lte = Number(maxPrice);
            }
        }
        Object.keys(variants).forEach(key => {
            filter[`variants.${key}`] = variants[key];
        });
        let sortOption = {};
        if (sortByPrice) {
            sortOption["variants.price"] = sortByPrice === "asc" ? 1 : -1;
        }
        const products = await Product.find(filter).sort(sortOption);
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.log("🚨 Lỗi khi lấy sản phẩm:", error.message);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy sản phẩm",
            error: error.message
        });
    }
};
const getSimilarProducts = async (req, res) => {
    try {
        const { productId } = req.params;

        // Lấy thông tin sản phẩm hiện tại
        const currentProduct = await Product.findById(productId);
        if (!currentProduct) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        // Lấy giá thấp nhất và cao nhất trong variants của sản phẩm hiện tại
        const prices = currentProduct.variants.map(v => v.price);
        const minProductPrice = Math.min(...prices);
        const maxProductPrice = Math.max(...prices);

        // Tính khoảng giá ±2 triệu
        const minPrice = minProductPrice - 2000000;
        const maxPrice = maxProductPrice + 2000000;

        // Lọc các sản phẩm có cùng danh mục và giá nằm trong khoảng này
        const similarProducts = await Product.find({
            category_id: currentProduct.category_id,
            _id: { $ne: productId }, // Loại bỏ chính sản phẩm hiện tại
            "variants.price": { $gte: minPrice, $lte: maxPrice } // Lọc theo khoảng giá
        }).limit(10); // Giới hạn số lượng sản phẩm trả về

        res.status(200).json({
            success: true,
            products: similarProducts
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy sản phẩm tương tự", error: error.message });
    }
};


module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getProductsByBrand,
    getProductImage,
    filterProduct,
    getSimilarProducts
   
};
