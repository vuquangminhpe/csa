const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsByBrand,
  getProductImage,  
  filterProduct,
  getSimilarProducts,
} = require("../controllers/productController");

// Cấu hình multer đơn giản
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ cho phép upload file ảnh!'));
  }
});

// Các route hiện có...


// Route lấy tất cả sản phẩm
router.get("/products", getAllProducts);

router.get("/products/:id", getProductById);
router.get("/products/category/:categoryId", getProductsByCategory);
router.get("/products/category/:categoryId/brand/:brand", getProductsByBrand);
//lọc sản phẩm
router.get("/products/filter/search", filterProduct);
// Thêm sản phẩm 
router.post("/products", upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 4 }
]), createProduct);
router.put("/products/:id", upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 4 }
]), updateProduct);
router.delete("/products/:id", deleteProduct);

// Route trả về ảnh của sản phẩm theo id
router.get("/products/:id/image", getProductImage);
router.get("/products/similar/:productId", getSimilarProducts);

module.exports = router;
