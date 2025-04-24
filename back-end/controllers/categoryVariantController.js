const CategoryVariant = require('../models/CategoryVariant');

const getVariantByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        const categoryVariant = await CategoryVariant.findOne({ category_id: categoryId });
        
        if (!categoryVariant) {
            return res.json({
                success: true,
                variant_type: null // Trả về null nếu category không có variant
            });
        }

        // Lấy các options cho từng loại variant
        let options = [];
        switch (categoryVariant.variant_type) {
            case 'storage':
                options = ['128GB', '256GB', '512GB', '1TB'];
                break;
            case 'ram':
                options = ['4GB', '8GB', '16GB', '32GB'];
                break;
            case 'size':
                options = ['S', 'M', 'L', 'XL', 'XXL'];
                break;
            default:
                options = [];
        }

        res.json({
            success: true,
            variant_type: categoryVariant.variant_type,
            options: options
        });
    } catch (error) {
        console.error("Error in getVariantByCategory:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin variant",
            error: error.message
        });
    }
};

module.exports = {
    getVariantByCategory
}; 