const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../middleware/upload');
// const auth = require('../middleware/auth'); // Middleware xác thực (nếu cần)

// Lấy tất cả bài đăng
router.get('/', postController.getAllPosts);

// Lấy một bài đăng theo ID
router.get('/:id', postController.getPostById);

// Tạo bài đăng mới với upload nhiều ảnh
// router.post('/', auth, upload.array('images', 10), postController.createPost); // Với xác thực
router.post('/', upload.array('images', 10), postController.createPost); // Không có xác thực

// Cập nhật bài đăng với upload nhiều ảnh
// router.put('/:id', auth, upload.array('images', 10), postController.updatePost); // Với xác thực
router.put('/:id', upload.array('images', 10), postController.updatePost); // Không có xác thực

// Xóa bài đăng
// router.delete('/:id', auth, postController.deletePost); // Với xác thực
router.delete('/:id', postController.deletePost); // Không có xác thực

module.exports = router; 