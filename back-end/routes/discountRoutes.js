const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discountController");

// Định nghĩa các route API
router.post("/add", discountController.addDiscount); // Thêm mã giảm giá
router.put("/update/:id", discountController.updateDiscount); // Cập nhật mã giảm giá
router.delete("/delete/:id", discountController.deleteDiscount); // Xóa mã giảm giá
router.get("/list", discountController.getAllDiscounts); // Lấy danh sách mã giảm giá

module.exports = router;
