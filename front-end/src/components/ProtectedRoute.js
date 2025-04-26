import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const location = useLocation(); // Lấy đường dẫn hiện tại

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  let role = "";

  // Xử lý role từ object hoặc string
  if (typeof storedUser.role === "string") {
    role = storedUser.role.toLowerCase();
  } else if (storedUser.role && storedUser.role.role) {
    role = storedUser.role.role.toLowerCase();
  } else {
    return <Navigate to="/" replace />;
  }

  // Kiểm tra nếu không thuộc danh sách role cho phép
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // Nếu role là "sale" nhưng đang cố truy cập trang khác ngoài "/sale", redirect về "/sale"
  if (role === "sale" && location.pathname !== "/sale") {
    return <Navigate to="/sale" replace />;
  }

  return children;
};

export default ProtectedRoute;
