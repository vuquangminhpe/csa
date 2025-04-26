import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Input, Button, List, Typography, Layout, Badge } from "antd";
import { SendOutlined } from "@ant-design/icons";
import "./SaleChat_sl.css";

const { Sider, Content } = Layout;

const SaleChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const chatContainerRef = useRef(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Lấy Sale ID từ localStorage
  const saleUser = JSON.parse(localStorage.getItem("user"));
  const saleId = saleUser?._id || null;

  // Lấy danh sách cuộc trò chuyện
  useEffect(() => {
    if (saleId) {
      axios
        .get(`http://localhost:9999/api/conversation/all-customers`)
        .then((res) => {
          setConversations(res.data);
          // Tính tổng số tin nhắn chưa đọc
          const total = res.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
          setTotalUnreadCount(total);
          console.log("🔴 Tổng số tin nhắn chưa đọc:", total);
        })
        .catch((err) => console.error("Lỗi tải danh sách cuộc trò chuyện:", err));
    }
  }, [saleId]);

  // Lấy tin nhắn khi chọn cuộc trò chuyện
  useEffect(() => {
    if (selectedConversation) {
      axios
        .get(`http://localhost:9999/api/conversation/messages/${selectedConversation._id}`)
        .then((res) => setMessages(res.data))
        .catch((err) => console.error("Lỗi tải tin nhắn:", err));
    }
  }, [selectedConversation]);

  // Cuộn xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Thêm hàm lọc và sắp xếp conversations
  const filteredAndSortedConversations = conversations
    .filter(conv => 
      conv.customerId.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => 
      new Date(b.lastMessage?.timestamp || 0) - new Date(a.lastMessage?.timestamp || 0)
    );

  // Thêm hàm đánh dấu đã đọc tin nhắn
  const markAsRead = async (conversationId) => {
    try {
      await axios.post("http://localhost:9999/api/conversation/read", { conversationId });
      // Cập nhật lại danh sách conversation và tổng số tin nhắn chưa đọc
      const updatedConversations = conversations.map(conv => {
        if (conv._id === conversationId) {
          setTotalUnreadCount(prev => prev - (conv.unreadCount || 0)); // Giảm tổng số tin nhắn chưa đọc
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });
      setConversations(updatedConversations);
    } catch (err) {
      console.error("Lỗi khi đánh dấu đã đọc:", err);
    }
  };

  // Cập nhật hàm xử lý khi chọn conversation
  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    if (conv.unreadCount > 0) {
      markAsRead(conv._id);
    }
  };

  // Gửi tin nhắn
  const sendMessage = () => {
    if (!message.trim() || !selectedConversation) return;

    const newMessage = {
      conversationId: selectedConversation._id,
      senderId: saleId,
      text: message,
    };

    axios
      .post("http://localhost:9999/api/conversation/send", newMessage)
      .then((res) => {
        setMessages([...messages, res.data]);
        setMessage("");
      })
      .catch((err) => console.error("Lỗi gửi tin nhắn:", err));
  };

  return (
    <Layout className="sale-chat-container_sl">
      {/* Danh sách cuộc trò chuyện */}
      <Sider width={280} className="chat-sidebar_sl">
        <Typography.Title level={3} className="chat-title_sl">
          Cuộc trò chuyện
          {totalUnreadCount > 0 && (
            <Badge 
              count={totalUnreadCount} 
              style={{ 
                backgroundColor: '#1890ff',
                marginLeft: '10px'
              }} 
            />
          )}
        </Typography.Title>
        
        {/* Thêm ô tìm kiếm */}
        <Input
          placeholder="Tìm kiếm khách hàng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="chat-search_sl"
          style={{ marginBottom: '10px' }}
        />

        <List
          itemLayout="horizontal"
          dataSource={filteredAndSortedConversations}
          renderItem={(conv) => (
            <List.Item
              className={`chat-item_sl ${selectedConversation?._id === conv._id ? "active_sl" : ""}`}
              onClick={() => handleSelectConversation(conv)}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{conv.customerId.name}</span>
                    {conv.unreadCount > 0 && (
                      <Badge count={conv.unreadCount} style={{ backgroundColor: '#1890ff' }} />
                    )}
                  </div>
                }
                description={
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {conv.lastMessage?.text && 
                      `${conv.lastMessage.text.substring(0, 20)}${conv.lastMessage.text.length > 20 ? '...' : ''}`
                    }
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Sider>

      {/* Khung trò chuyện */}
      <Layout className="chat-main_sl">
        {selectedConversation ? (
          <>
            <div className="chat-header_sl">{selectedConversation.customerId.name}</div>
            <div className="chat-messages_sl" ref={chatContainerRef}>
              {messages.map((msg, index) => (
                <div key={index} className={`chat-message_sl ${msg.senderId === saleId ? "sent_sl" : "received_sl"}`}>
                  <p>{msg.text}</p>
                  <span className="chat-time_sl">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="chat-input-container_sl">
              <Input
                className="chat-input_sl"
                placeholder="Nhập tin nhắn..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPressEnter={sendMessage}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} className="chat-send_sl">
                Gửi
              </Button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder_sl">Chọn một cuộc trò chuyện để bắt đầu</div>
        )}
      </Layout>
    </Layout>
  );
};

export default SaleChat;
