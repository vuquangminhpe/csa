const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const cartRoutes = require("./routes/cartRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const discountRoutes = require("./routes/discountRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const questionRoutes = require("./routes/questionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const geminiRoutes = require("./routes/geminiRoutes");
const postRoutes = require('./routes/postRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import cors
const path = require("path");
const fs = require('fs');


dotenv.config();
connectDB();

const app = express();

app.use(cors());

app.use(bodyParser.json());

// Tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/users", userRoutes);
app.use("/api", productRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api", cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", orderRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/question", questionRoutes); // Định nghĩa route API hỏi đáp
app.use("/api/notification", notificationRoutes); 
app.use("/api/gemini", geminiRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/conversation', conversationRoutes);
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
