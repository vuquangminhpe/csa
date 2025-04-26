import React, { useState, useEffect } from "react";
import { Dropdown, Badge, Button, List, Empty } from "antd";
import { BellOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Notification.css";

const Notification = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:9999/api/notification/${userId}`);
      let notificationList = [];
      if (response.data && Array.isArray(response.data.notifications)) {
        notificationList = response.data.notifications;
      }
      setNotifications(notificationList);

      const unread = notificationList.filter((notif) => !notif.isRead).length;
      setUnreadCount(unread);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy thông báo:", error);
      setNotifications([]);
      setUnreadCount(0);
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
      console.error("Lỗi khi cập nhật trạng thái đọc:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`http://localhost:9999/api/notification/mark-all-read/${userId}`);
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả là đã đọc:", error);
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

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "comment") return notif.type === "comment";
    if (filter === "transaction") return notif.type === "transaction";
    if (filter === "order") return notif.type === "order";
    return true;
  });

  const menu = (
    <div className="notification-dropdown_ntf">
      <div className="notification-header_ntf">
        <h4>Thông báo</h4>
        <Button
          type="text"
          icon={<CheckCircleOutlined />}
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="mark-all-btn_ntf"
        >
          {unreadCount === 0 ? "Bạn đã đọc tất cả thông báo" : "Đánh dấu đã đọc tất cả"}
        </Button>
      </div>

      <div className="notification-tabs_ntf">
        <button className={`filter-btn_ntf ${filter === "all" ? "active_ntf" : ""}`} onClick={() => setFilter("all")}>
          Tất cả
        </button>
        <button className={`filter-btn_ntf ${filter === "comment" ? "active_ntf" : ""}`} onClick={() => setFilter("comment")}>
          Bình luận
        </button>
        <button className={`filter-btn_ntf ${filter === "transaction" ? "active_ntf" : ""}`} onClick={() => setFilter("transaction")}>
          Giao dịch
        </button>
        <button className={`filter-btn_ntf ${filter === "order" ? "active_ntf" : ""}`} onClick={() => setFilter("order")}>
          Đơn hàng
        </button>
      </div>

      <div className="notification-list_ntf">
        {filteredNotifications.length > 0 ? (
          <List
            loading={loading}
            dataSource={filteredNotifications}
            renderItem={(notif) => (
              <List.Item className={`notification-item_ntf ${notif.isRead ? "read_ntf" : "unread_ntf"}`}>
                <div className="notification-content_ntf">
                  <p className="notification-message_ntf">{notif.message}</p>
                  <span className="notification-time_ntf">{formatTimeAgo(notif.createdAt)}</span>
                  <Link to={notif.link} onClick={() => markAsRead(notif._id)}>
                    <Button type="link" className="view-detail-btn_ntf">Xem chi tiết</Button>
                  </Link>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Không có thông báo nào" className="no-notifications_ntf" />
        )}
      </div>

      <Link to="/notifications" className="view-all-btn_ntf">
        Xem tất cả
      </Link>
    </div>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]} onOpenChange={() => setFilter("all")}>
      <Badge count={unreadCount} className="notification-badge_ntf">
        <BellOutlined className="notification-icon_ntf" />
      </Badge>
    </Dropdown>
  );
};

export default Notification;
