const DiscountCode = require("../models/DiscountCode");

// Thêm mã giảm giá mới
exports.addDiscount = async (req, res) => {
    try {
        const discount = new DiscountCode(req.body);
        await discount.save();
        res.status(201).json({ message: "Mã giảm giá đã được thêm!", discount });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Cập nhật mã giảm giá
exports.updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedDiscount = await DiscountCode.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedDiscount) return res.status(404).json({ message: "Không tìm thấy mã giảm giá!" });
        res.status(200).json({ message: "Cập nhật thành công!", updatedDiscount });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Xóa mã giảm giá
exports.deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDiscount = await DiscountCode.findByIdAndDelete(id);
        if (!deletedDiscount) return res.status(404).json({ message: "Không tìm thấy mã giảm giá!" });
        res.status(200).json({ message: "Xóa mã giảm giá thành công!" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Lấy danh sách mã giảm giá
exports.getAllDiscounts = async (req, res) => {
    try {
        const discounts = await DiscountCode.find();
        res.status(200).json(discounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

