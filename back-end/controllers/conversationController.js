const Conversation = require("../models/Conversation");
const User = require("../models/User");

// 📌 Tạo hoặc lấy cuộc trò chuyện giữa Customer và Sale
exports.createOrGetConversation = async (req, res) => {
  try {
    const { customerId } = req.body;

    // Kiểm tra xem Customer đã có conversation chưa
    let conversation = await Conversation.findOne({ customerId });

    if (!conversation) {
      conversation = new Conversation({ customerId, messages: [] });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 📌 Gửi tin nhắn (Customer hoặc Sale đều gửi được)
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Cuộc trò chuyện không tồn tại" });
    }

    const newMessage = {
      senderId,
      text,
      timestamp: new Date(),
      isRead: false,
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = { text, timestamp: new Date() };

    // Nếu Sale trả lời lần đầu tiên → cập nhật saleId
    if (conversation.customerId.toString() !== senderId && !conversation.saleId) {
      conversation.saleId = senderId;
    }

    // Nếu Customer gửi tin nhắn → tăng số tin nhắn chưa đọc
    if (conversation.customerId.toString() !== senderId) {
      conversation.unreadCount += 1;
    }

    await conversation.save();

    console.log("📨 New Message Sent:", newMessage);
    console.log("🔴 Updated Unread Count:", conversation.unreadCount);

    res.status(200).json(newMessage);
  } catch (error) {
    console.error("❌ Lỗi khi gửi tin nhắn:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 📌 Lấy danh sách tất cả cuộc trò chuyện (Dành cho Sale)
exports.getAllCustomerChats = async (req, res) => {
  try {
    const conversations = await Conversation.find({})
      .populate("customerId", "name image")
      .populate("saleId", "name image")
      .sort({ "lastMessage.timestamp": -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 📌 Lấy tin nhắn của một cuộc trò chuyện
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Cuộc trò chuyện không tồn tại" });
    }

    res.status(200).json(conversation.messages);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 📌 Đánh dấu tin nhắn là đã đọc

exports.markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Cuộc trò chuyện không tồn tại" });
    }

    // Đánh dấu tất cả tin nhắn là đã đọc
    conversation.messages.forEach((msg) => (msg.isRead = true));
    conversation.unreadCount = 0;

    await conversation.save();
    res.status(200).json({ message: "Đã đọc tất cả tin nhắn" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};
