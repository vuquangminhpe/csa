import React, { useState, useEffect } from "react";
import { Button, List, Pagination, Spin, Empty } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Common/Header";
import Footer from "../../components/Common/Footer";
import "./NotificationPage.css";

const NotificationPage = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, filter, currentPage]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const filterParam = filter === "all" ? "" : `&type=${filter}`;
      const response = await axios.get(
        `http://localhost:9999/api/notification/${userId}?page=${currentPage}&limit=${pageSize}${filterParam}`
      );
  
      console.log("🚀 API Response:", response.data); // Log dữ liệu API trả về
  
      let notificationList = [];
      if (response.data && Array.isArray(response.data.notifications)) {
        notificationList = response.data.notifications;
      }
  
      console.log("🛠 Notifications:", notificationList); // Log lại danh sách thông báo
  
      setNotifications(notificationList);  // ✅ Cập nhật danh sách thông báo
      setTotalNotifications(response.data.total || 0);
      setUnreadCount(notificationList.filter((notif) => !notif.isRead).length);
  
      setLoading(false);
    } catch (error) {
      console.error("🚨 Lỗi khi lấy thông báo:", error);
      setNotifications([]); // 🔥 Luôn đảm bảo notifications là một mảng
      setTotalNotifications(0);
      setLoading(false);
    }
  };
  
  
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:9999/api/notification/read/${notificationId}`);
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === notificationId ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("🚨 Lỗi khi cập nhật trạng thái đọc:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`http://localhost:9999/api/notification/mark-all-read/${userId}`);
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("🚨 Lỗi khi đánh dấu tất cả là đã đọc:", error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const timeDiff = Date.now() - new Date(timestamp);
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return "Vừa xong";
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Header />
      <div className="notification-wrapper">
        <div className="notification-sidebar">
          <h3>Thông Báo</h3>
          <ul>
            <li className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
              Tất cả
            </li>
            <li className={filter === "comment" ? "active" : ""} onClick={() => setFilter("comment")}>
              Bình luận
            </li>
            <li className={filter === "transaction" ? "active" : ""} onClick={() => setFilter("transaction")}>
              Giao dịch
            </li>
            <li className={filter === "order" ? "active" : ""} onClick={() => setFilter("order")}>
              Đơn hàng
            </li>
          </ul>
        </div>

        <div className="notification-content">
          <div className="notification-header">
            <h2>Thông báo</h2>
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="mark-all-btn"
            >
              {unreadCount === 0 ? "Bạn đã đọc tất cả thông báo" : "Đánh dấu đã đọc tất cả"}
            </Button>
          </div>

          <div className="notification-list">
            {loading ? (
              <Spin size="large" />
            ) : notifications.length > 0 ? (
              <List
                dataSource={notifications}
                renderItem={(notif) => (
                  <List.Item className={`notification-item ${notif.isRead ? "read" : "unread"}`}>
                    <div className="notification-info">
                      <p className="notification-message">{notif.message}</p>
                      <span className="notification-time">{formatTimeAgo(notif.createdAt)}</span>
                    </div>
                    <Link to={notif.link} onClick={() => markAsRead(notif._id)}>
                      <Button type="link">Xem chi tiết</Button>
                    </Link>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Không có thông báo nào" className="no-notifications" />
            )}
          </div>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalNotifications} // Dùng total từ API
            onChange={handlePageChange}
            className="pagination"
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotificationPage;
