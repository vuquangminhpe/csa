import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const RoleRouteGuard = ({ children }) => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  // Danh sách các trang công khai
  const publicRoutes = [
    "/", 
    "/login", 
    "/register", 
    "/forgot-password", 
    "/product", 
    "/products", 
    "/contact", 
    "/news",
    "/verify-email",
    "/warranty"
  ];

  // Nếu không có user (đã đăng xuất), cho phép truy cập các trang công khai
  if (!storedUser) {
    const isPublicRoute = publicRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(route + "/")
    );

    if (!isPublicRoute) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  // Xác định role
  let role = "";
  if (typeof storedUser.role === "string") {
    role = storedUser.role.toLowerCase();
  } else if (storedUser.role && storedUser.role.role) {
    role = storedUser.role.role.toLowerCase();
  }

  // Nếu là admin, cho phép truy cập tất cả các trang
  if (role === "admin") {
    return children;
  }

  // Định nghĩa các role và trang được phép truy cập
  const roleRoutes = {
    manager: {
      allowedRoutes: ["/manager"],
      defaultRoute: "/manager",
      restrictPublicRoutes: true
    },
    sale: {
      allowedRoutes: ["/sale"],
      defaultRoute: "/sale",
      restrictPublicRoutes: true
    },
    shipper: {
      allowedRoutes: ["/shipper"],
      defaultRoute: "/shipper",
      restrictPublicRoutes: true
    },
    customer: {
      allowedRoutes: [
        "/account",
        "/cart",
        "/orders",
        "/favorites",
        "/verify-order",
        "/checkout",
        "/success",
        "/cancel",
        "/notifications",
        "/order-processing",
      ],
      defaultRoute: "/",
      restrictPublicRoutes: false
    }
  };

  // Kiểm tra role và điều hướng
  if (roleRoutes[role]) {
    const { allowedRoutes, defaultRoute, restrictPublicRoutes } = roleRoutes[role];
    
    // Xác định các trang được phép truy cập dựa trên role
    let permittedRoutes = [...allowedRoutes];
    
    // Nếu role không bị hạn chế truy cập trang công khai, thêm publicRoutes vào danh sách
    if (!restrictPublicRoutes) {
      permittedRoutes = [...permittedRoutes, ...publicRoutes];
    }
    
    // Kiểm tra xem đường dẫn hiện tại có được phép không
    const isAllowedRoute = permittedRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(route + "/")
    );

    // Nếu không được phép, chuyển về trang mặc định của role đó
    if (!isAllowedRoute) {
      return <Navigate to={defaultRoute} replace />;
    }
  }

  // Nếu là role khác hoặc đường dẫn được phép, cho phép truy cập
  return children;
};

export default RoleRouteGuard; 
