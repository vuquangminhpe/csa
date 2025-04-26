import React, { useState, useEffect, useRef } from "react";
import "./Conversation_chat.css";
import { Input, Button, Badge } from "antd";
import { SendOutlined, MessageOutlined } from "@ant-design/icons";
import axios from "axios";

const Conversation = () => {
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatContainerRef = useRef(null);

  // Lấy userId từ Local Storage khi component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserId(parsedUser._id);
      fetchConversation(parsedUser._id);
    }
  }, []);

  // Lấy cuộc trò chuyện hiện tại và số tin nhắn chưa đọc
  const fetchConversation = async (customerId) => {
    try {
      const res = await axios.post("http://localhost:9999/api/conversation/", { customerId });
      setMessages(res.data.messages || []);
      setConversationId(res.data._id);
      setUnreadCount(res.data.unreadCount || 0);

      console.log("📥 Fetched Conversation:", res.data);
      console.log("🔴 unreadCount từ API:", res.data.unreadCount);
      
      // Sau khi load tin nhắn, cuộn xuống tin nhắn mới nhất
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (err) {
      console.error("❌ Lỗi tải cuộc trò chuyện:", err);
    }
  };

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!message.trim() || !conversationId || !userId) return;

    const newMessage = {
      conversationId,
      senderId: userId,
      text: message,
    };

    try {
      const res = await axios.post("http://localhost:9999/api/conversation/send", newMessage);
      setMessages([...messages, res.data]);
      setMessage("");

      // Cập nhật cuộc trò chuyện và cuộn xuống cuối
      fetchConversation(userId);
      
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (err) {
      console.error("❌ Lỗi gửi tin nhắn:", err);
    }
  };

  // Mở cửa sổ chat và đánh dấu tin nhắn đã đọc
  const openChat = async () => {
    setIsOpen(true);
    setUnreadCount(0);

    if (conversationId) {
      try {
        await axios.post("http://localhost:9999/api/conversation/read", { conversationId });
        fetchConversation(userId); // Cập nhật lại số tin nhắn chưa đọc
      } catch (err) {
        console.error("❌ Lỗi đánh dấu tin nhắn đã đọc:", err);
      }
    }

    // Khi mở chat, cuộn xuống cuối cùng
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  return (
    <div className="chat-container_chat">
      {/* Nút mở chat với thông báo số tin nhắn chưa đọc */}
      {!isOpen && (
        <div className="chat-icon_chat" onClick={openChat}>
          <Badge count={unreadCount > 0 ? unreadCount : 0} offset={[10, 0]}>
            <MessageOutlined />
          </Badge>
          <span>Chat</span>
        </div>
      )}

      {/* Cửa sổ chat */}
      {isOpen && (
        <div className="chat-box_chat">
          <div className="chat-header_chat">
            <span>Hỗ trợ trực tuyến</span>
            <button className="close-btn_chat" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="chat-messages_chat" ref={chatContainerRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message_chat ${msg.senderId === userId ? "sent_chat" : "received_chat"}`}>
                <span className="sender_chat">{msg.senderId === userId ? "Bạn" : "Quản trị viên"}</span>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="chat-input_chat">
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Nhập tin nhắn..." onPressEnter={sendMessage} />
            <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversation;
