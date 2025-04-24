const PayOS = require("@payos/node");
require("dotenv").config();

// ✅ Khởi tạo PayOS với các thông tin từ file .env
module.exports = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);
