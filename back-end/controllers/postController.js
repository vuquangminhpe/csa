const Post = require('../models/Post');
const fs = require('fs');
const path = require('path');

// Lấy tất cả bài đăng
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bài đăng', error: error.message });
  }
};

// Lấy một bài đăng theo ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy bài đăng', error: error.message });
  }
};

// Tạo bài đăng mới
exports.createPost = async (req, res) => {
  try {
    const { title, content, author_id } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!title || !content || !author_id) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin bài đăng' });
    }
    
    // Xử lý file ảnh đã upload
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    
    const newPost = new Post({
      title,
      content,
      images: imagePaths,
      author_id
    });
    
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo bài đăng', error: error.message });
  }
};

// Cập nhật bài đăng
exports.updatePost = async (req, res) => {
  try {
    const { title, content, deleteOldImages, imagesToDelete } = req.body;
    const postId = req.params.id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    }
    
    // Cập nhật thông tin cơ bản
    post.title = title;
    post.content = content;
    
    // Xử lý xóa từng ảnh cụ thể
    if (imagesToDelete) {
      const imagesToDeleteArray = JSON.parse(imagesToDelete);
      
      if (imagesToDeleteArray.length > 0) {
        // Xóa các file ảnh từ thư mục uploads
        imagesToDeleteArray.forEach(imagePath => {
          const filename = imagePath.split('/').pop();
          const filePath = path.join(__dirname, '../uploads', filename);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Đã xóa file: ${filePath}`);
          }
        });
        
        // Cập nhật danh sách ảnh trong database
        post.images = post.images.filter(imagePath => 
          !imagesToDeleteArray.includes(imagePath)
        );
      }
    }
    
    // Xử lý thêm ảnh mới
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
      
      if (deleteOldImages === 'true') {
        // Xóa các file ảnh cũ từ thư mục uploads
        if (post.images && post.images.length > 0) {
          post.images.forEach(imagePath => {
            const filename = imagePath.split('/').pop();
            const filePath = path.join(__dirname, '../uploads', filename);
            
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Đã xóa file cũ: ${filePath}`);
            }
          });
        }
        
        post.images = newImagePaths;
      } else {
        post.images = [...post.images, ...newImagePaths];
      }
    }
    
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error('Lỗi khi cập nhật bài đăng:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật bài đăng', error: error.message });
  }
};

// Xóa bài đăng
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    // Tìm bài đăng trước khi xóa để lấy danh sách ảnh
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    }
    
    // Xóa các file ảnh từ thư mục uploads
    if (post.images && post.images.length > 0) {
      post.images.forEach(imagePath => {
        // Lấy tên file từ đường dẫn
        const filename = imagePath.split('/').pop();
        const filePath = path.join(__dirname, '../uploads', filename);
        
        // Kiểm tra xem file có tồn tại không trước khi xóa
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Đã xóa file: ${filePath}`);
        } else {
          console.log(`File không tồn tại: ${filePath}`);
        }
      });
    }
    
    // Xóa bài đăng từ database
    await Post.findByIdAndDelete(postId);
    
    res.status(200).json({ message: 'Xóa bài đăng thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa bài đăng:', error);
    res.status(500).json({ message: 'Lỗi khi xóa bài đăng', error: error.message });
  }
}; 