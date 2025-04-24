const express = require("express");
const {
  createOrGetConversation,
  sendMessage,
  getAllCustomerChats,
  getMessages,
  markMessagesAsRead,
} = require("../controllers/conversationController");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.post("/", createOrGetConversation); // Tạo hoặc lấy cuộc trò chuyện
router.post("/send", sendMessage); // Gửi tin nhắn
router.get("/all-customers", getAllCustomerChats); // Lấy danh sách tất cả Customer đã chat
router.get("/messages/:conversationId", getMessages); // Lấy tin nhắn của một cuộc trò chuyện
router.post("/read", markMessagesAsRead); // Đánh dấu tin nhắn đã đọc

module.exports = router;
