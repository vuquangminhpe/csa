const User = require('../models/User');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // Không cần bcryptjs nữa

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra email tồn tại
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        // So sánh password plain text
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};

module.exports = {
    login
}; 