const Category = require("../models/Category");

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh mục", error });
  }
};

// Lấy danh mục theo ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Danh mục không tồn tại" });

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh mục", error });
  }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description, parent_category, sub_categories, attributes } = req.body;

    const newCategory = new Category({
      name,
      description,
      parent_category: parent_category || null,
      sub_categories: sub_categories || [],
      attributes: attributes || [],
    });

    await newCategory.save();
    res.status(201).json({ message: "Danh mục đã được tạo", category: newCategory });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo danh mục", error });
  }
};

// Cập nhật danh mục theo ID
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, parent_category, sub_categories, attributes } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, parent_category, sub_categories, attributes },
      { new: true }
    );

    if (!updatedCategory) return res.status(404).json({ message: "Danh mục không tồn tại" });

    res.status(200).json({ message: "Danh mục đã được cập nhật", category: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật danh mục", error });
  }
};

// Xóa danh mục theo ID
exports.deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) return res.status(404).json({ message: "Danh mục không tồn tại" });

    res.status(200).json({ message: "Danh mục đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa danh mục", error });
  }
};
