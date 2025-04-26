import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ManageOrder from "../../components/Sales/ManageOrder";
import ManageDiscount from "../../components/Sales/ManageDiscount";
import ManageQuestion from "../../components/Sales/ManageQuestions";
import ManageProduct from "../../components/Sales/MangerProduct";
import ManagePosts from "../../components/Sales/ManagePosts";
import "./SalePage.css";
import SaleChat from "../../components/Sales/SaleChat";
function SidebarButton({ text, isActive, onClick }) {
  return (
    <button
      className={`sidebar__button ${isActive ? "sidebar__button--active" : ""}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

function SalePage() {
  const [activeTab, setActiveTab] = useState("products");
  const navigate = useNavigate();

  const handleLogout = () => {
    const isConfirmed = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (isConfirmed) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  return (
    <div className="sale-page">
      {/* Thêm nút đăng xuất */}
      <button className="logout-button-sale" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i> Đăng xuất
      </button>

      {/* Sidebar */}
      <aside className="sale-page__sidebar">
        <div className="sale-page__sidebar-header">
          <h2 className="sale-page__logo">Manage</h2>
        </div>
        <nav className="sale-page__menu">
          <SidebarButton
            text="Quản lý sản phẩm"
            isActive={activeTab === "products"}
            onClick={() => setActiveTab("products")}
          />
          <SidebarButton
            text="Quản lý đơn hàng"
            isActive={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />
          <SidebarButton
            text="Quản lý mã giảm giá"
            isActive={activeTab === "discounts"}
            onClick={() => setActiveTab("discounts")}
          />
          <SidebarButton
            text="Quản lý hỏi đáp"
            isActive={activeTab === "questions"}
            onClick={() => setActiveTab("questions")}
          />
          <SidebarButton
            text="Quản lý bài đăng"
            isActive={activeTab === "posts"}
            onClick={() => setActiveTab("posts")}
          />
          <SidebarButton
            text="Trò chuyện với khách hàng"
            isActive={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          />
        </nav>
      </aside>

      {/* Nội dung chính */}
      <main className="sale-page__content">
        <h1 className="sale-page__title">Xin chào Sales</h1>

        {/* Hiển thị component tương ứng */}
        {activeTab === "products" && <ManageProduct />}
        {activeTab === "orders" && <ManageOrder />}
        {activeTab === "discounts" && <ManageDiscount />}
        {activeTab === "questions" && <ManageQuestion />}
        {activeTab === "posts" && <ManagePosts />}
        {activeTab === "chat" && <SaleChat />}
      </main>
    </div>
  );
}

export default SalePage;
