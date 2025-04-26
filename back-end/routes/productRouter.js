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
} = require("../controllers/productController");
const { authMiddleware, checkRole } = require("../middleware/auth");

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
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
    cb(new Error("Chỉ cho phép upload file ảnh!"));
  },
});

// Lấy tất cả sản phẩm
router.get("/", getAllProducts);

// Lấy sản phẩm theo ID
router.get("/:id", getProductById);

// Lấy sản phẩm theo danh mục
router.get("/category/:categoryId", getProductsByCategory);

// Thêm sản phẩm mới (chỉ admin)
router.post(
  "/",
  authMiddleware,
  checkRole(["admin"]),
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 4 },
  ]),
  createProduct
);

// Cập nhật sản phẩm (chỉ admin)
router.put(
  "/:id",
  authMiddleware,
  checkRole(["admin"]),
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 4 },
  ]),
  updateProduct
);

// Xóa sản phẩm (chỉ admin)
router.delete("/:id", authMiddleware, checkRole(["admin"]), deleteProduct);

module.exports = router;
