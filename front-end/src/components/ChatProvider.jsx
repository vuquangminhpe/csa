import React, { useState, useEffect } from "react";
import Chatbot from "./Chatbot/Chatbot";
import Conversation from "./Conversation/Conversation";

const ChatProvider = () => {
  const [userRole, setUserRole] = useState(null);

  // Hàm lấy role từ localStorage
  const fetchUserRole = () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const role = storedUser?.role?.role?.toLowerCase() || storedUser?.role?.toLowerCase() || null;
    setUserRole(role);
  };

  useEffect(() => {
    fetchUserRole(); // Lấy role khi component mount

    // Lắng nghe thay đổi của localStorage khi đăng nhập / đăng xuất
    const handleStorageChange = (event) => {
      if (event.key === "user") {
        fetchUserRole();
      }
    };

    // Lắng nghe sự kiện CustomEvent khi đăng nhập / đăng xuất
    const handleUserUpdate = () => {
      fetchUserRole();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdate", handleUserUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdate", handleUserUpdate);
    };
  }, []);

  return (
    <>
      {/* Hiển thị Chatbot nếu user chưa đăng nhập hoặc không phải admin, manager, sale */}
      {(!userRole || (userRole !== "admin" && userRole !== "manager" && userRole !== "sale")) && <Chatbot />}

      {/* Chỉ hiển thị Conversation khi user là Customer */}
      {userRole === "customer" && <Conversation />}
    </>
  );
};

export default ChatProvider;
