const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const http = require("http");
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const shippingRoutes = require("./routes/shippingRoutes");
const productRouter = require("./routes/productRouter");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
// const userRoutes = require("./routes/userRoutes");
const { setupSwagger } = require("./swagger/swagger-config");
const socketManager = require("./socket/socketManager");
dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Thiết lập Swagger
setupSwagger(app);

// app.use("/api/users", userRoutes);

app.use("/api/shipping", shippingRoutes);
app.use("/api/products", productRouter);
app.use("/api/auth", authRoutes);
app.use("/api", checkoutRoutes);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

socketManager.initSocket(server);

const OrderController = require("./controllers/orderController");
setInterval(async () => {
  try {
    console.log("Đang kiểm tra trạng thái đơn hàng...");
    const result = await OrderController.checkAndUpdateOrderStatus();
    if (result.updatedCount > 0) {
      console.log(`Đã cập nhật ${result.updatedCount} đơn hàng`);
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái đơn hàng:", error);
  }
}, 30000);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
