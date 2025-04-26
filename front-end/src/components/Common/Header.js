import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import logo from "../../assets/logo.png";
import logo2 from "../../assets/GearUp_logo2.png";
import axios from "axios";
import CategoryMenu from "../Category/CategoryMenu";
import Notification from "../Notification/Notification";
import Search from '../Search/Search';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Nếu cần dùng cho CategoryMenu hay sidebar
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra thông tin người dùng từ localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = async () => {
    // Xác nhận trước khi đăng xuất
    const isConfirmed = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (isConfirmed) {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.post(
          "http://localhost:9999/api/users/logout",
          null,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Luôn xóa token và thông tin người dùng khỏi localStorage
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        // Kích hoạt sự kiện cập nhật UI ngay lập tức
        window.dispatchEvent(new Event("userUpdate"));
        setUser(null);
        navigate("/");
        alert("Đăng xuất thành công!");

      } catch (error) {
        if (error.response?.status === 401) {
          // Token hết hạn hoặc không hợp lệ
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setUser(null);
          navigate("/login");
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        } else {
          console.error("Lỗi khi đăng xuất:", error.response?.data || error.message);
          alert("Có lỗi xảy ra khi đăng xuất");
        }
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
    console.log("Sidebar open:", !isSidebarOpen);
  };

  // Hàm điều hướng dựa trên vai trò (chưa sử dụng trực tiếp trong UI)
  const handleRoleRedirect = () => {
    if (user) {
      let role = "";
      if (typeof user.role === "string") {
        role = user.role.toLowerCase();
      } else if (user.role && user.role.role) {
        role = user.role.role.toLowerCase();
      } else {
        console.error("Không xác định được vai trò của người dùng.");
        return;
      }

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "manager") {
        navigate("/manager");
      } else if (role === "shipper") {
        navigate("/shipper");
      } else if (role === "sale") {
        navigate("/sale");
      } else {
        navigate("/account/profile");
      }
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <Link to="/">
          <img src={logo2} alt="GearUp logo" className="logo" />
        </Link>
        {/* Hiển thị menu danh mục */}
        <CategoryMenu />

        {/* Thêm nút tin tức */}
        <div className="menu-item news-button">
          <i className="fas fa-newspaper"></i>
          <Link to="/news">Tin tức</Link>
        </div>

        {/* Thêm nút bảo hành */}
        <div className="menu-item warranty-button">
          <i className="fas fa-shield-alt"></i>
          <Link to="/warranty">Bảo hành</Link>
        </div>
      </div>

      <Search />

      <div className="navbar-right">
        <div className="menu-item">
          <i className="fas fa-truck"></i>
          <Link to="/orders">Tra cứu đơn hàng</Link>
        </div>
        <div className="menu-item">
          <i className="fas fa-heart"></i>
          <Link to="/favorites">Yêu thích</Link>
        </div>
        <div className="menu-item">
          <i className="fas fa-shopping-bag"></i>
          <Link to="/cart">Giỏ hàng</Link>
        </div>

        <div className="menu-item">
          <Notification userId={user?._id} />
        </div>

        {/* Hiển thị thông tin người dùng và phân quyền */}
        {user ? (
          <div className="menu-item user-section">
            <i className="fas fa-user"></i>
            {/* Khi bấm vào tên sẽ điều hướng đến trang profile */}
            <span className="user-name" onClick={() => navigate("/account/profile")}>
              Xin chào, {user.name}!
            </span>

            {/* Nút quản lý dành cho admin hoặc manager */}
            {(user.role === "admin" || user.role === "manager" || user.role === "sale" || user.role === "shipper") && (
              <button
                className="manage-button"
                onClick={() => {
                  if (user.role === "admin") navigate("/admin");
                  else if (user.role === "manager") navigate("/manager");
                  else if (user.role === "sale") navigate("/sale");
                  else if (user.role === "shipper") navigate("/shipper");
                }}
              >
                Quản lý
              </button>
            )}

            {/* Nút quản lý sản phẩm chỉ dành cho manager */}
            {user.role === "manager" && (
              <button
                className="manage-products-button"
                onClick={() => navigate("/manager")}
              >
                Quản lý sản phẩm
              </button>
            )}

            {/* Nút đăng xuất */}
            <button onClick={handleLogout} className="logout-button">
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="menu-item">
            <i className="fas fa-user"></i>
            <Link to="/login">Đăng nhập</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
