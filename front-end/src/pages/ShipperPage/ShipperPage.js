import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ManageDelivery from "../../components/Shipper/ManageDelivery";
import DeliveryHistory from "../../components/Shipper/DeliveryHistory";
import ReturnOrders from "../../components/Shipper/ReturnOrders";
import "./ShipperPage.css";

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

function ShipperPage() {
  const [activeTab, setActiveTab] = useState("pending"); 
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
    <div className="shipper-page">
      {/* Thêm nút đăng xuất */}
      <button className="logout-button-shipper" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i> Đăng xuất
      </button>

      {/* Sidebar ngang */}
      <header className="shipper-page__header">
        <div className="shipper-page__logo-container">
          <h2 className="shipper-page__logo">Shipper</h2>
        </div>
        <nav className="shipper-page__menu">
          <SidebarButton 
            text="Đơn hàng chờ giao" 
            isActive={activeTab === "pending"} 
            onClick={() => setActiveTab("pending")} 
          />
          <SidebarButton 
            text="Đơn hàng đang giao" 
            isActive={activeTab === "active"} 
            onClick={() => setActiveTab("active")} 
          />
          <SidebarButton 
            text="Lịch sử giao hàng" 
            isActive={activeTab === "history"} 
            onClick={() => setActiveTab("history")} 
          />
          <SidebarButton 
            text="Đơn hàng trả" 
            isActive={activeTab === "returns"} 
            onClick={() => setActiveTab("returns")} 
          />

        </nav>
      </header>

      {/* Nội dung chính */}
      <main className="shipper-page__content">
        <h1 className="shipper-page__title">Xin chào Shipper</h1>
        
        {/* Hiển thị component tương ứng */}
        {activeTab === "pending" && <ManageDelivery status="pending" />}
        {activeTab === "active" && <ManageDelivery status="active" />}
        {activeTab === "history" && <DeliveryHistory />}
        {activeTab === "returns" && <ReturnOrders />}
      </main>
    </div>
  );
}

export default ShipperPage; 