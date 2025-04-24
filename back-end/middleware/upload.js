const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/'); // Thư mục lưu file
  },
  filename: function(req, file, cb) {
    // Tạo tên file duy nhất với timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file JPG và PNG'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // giới hạn 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload; 