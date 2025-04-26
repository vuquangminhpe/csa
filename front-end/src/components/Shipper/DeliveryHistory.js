import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import axios from "axios";
import "./ManageDelivery.css"; // Sử dụng file CSS chung
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function DeliveryHistory() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnOrderId, setReturnOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/orders");
      const completedOrders = response.data.data.filter(
        order => order.status === "Đã giao" || order.status === "Đã hủy" || order.status === "Đã hoàn thành"
      );
      
      // Log chi tiết hơn để kiểm tra
      console.log("Completed orders:", completedOrders);
      if (completedOrders.length > 0) {
        console.log("Sample order shipper_id:", completedOrders[0].shipper_id);
      }
      
      setOrders(completedOrders);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử giao hàng:", error);
    }
  };

  const handleShowDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const filterOrders = () => {
    return orders.filter(order => {
      // Lọc theo ngày
      if (filterDate) {
        const orderDate = new Date(order.updatedAt).toISOString().split('T')[0];
        if (orderDate !== filterDate) {
          return false;
        }
      }
      
      // Lọc theo trạng thái
      if (filterStatus !== "all" && order.status !== filterStatus) {
        return false;
      }
      
      return true;
    });
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      // Cập nhật trạng thái đơn hàng thành "Đã giao"
      await axios.put(`http://localhost:9999/api/orders/${orderId}/status`, {
        status: "Đã giao"
      });

      // Tìm đơn hàng trong state
      const orderToUpdate = orders.find(order => order._id === orderId);
      
      // Nếu là đơn hàng tiền mặt và đang chờ thanh toán, cập nhật trạng thái thanh toán
      if (orderToUpdate && 
          orderToUpdate.paymentMethod === "Tiền mặt" && 
          orderToUpdate.paymentStatus === "Chờ thanh toán") {
        await axios.put(`http://localhost:9999/api/orders/${orderId}/payment-status`, {
          paymentStatus: "Đã thanh toán"
        });
      }

      alert("Đã hoàn thành đơn hàng!");
      fetchOrders(); // Tải lại danh sách đơn hàng để cập nhật UI
    } catch (error) {
      console.error("Lỗi khi hoàn thành đơn:", error);
      alert("Có lỗi xảy ra khi hoàn thành đơn hàng");
    }
  };

  const handleReturnRequest = (orderId) => {
    setReturnOrderId(orderId);
    setReturnReason("");
    setShowReturnModal(true);
  };

  const submitReturnRequest = async () => {
    if (!returnReason.trim()) {
      alert("Vui lòng nhập lý do trả hàng");
      return;
    }

    try {
      await axios.post(`http://localhost:9999/api/orders/${returnOrderId}/return`, {
        reason: returnReason
      });
      
      alert("Yêu cầu trả hàng đã được gửi thành công");
      setShowReturnModal(false);
      fetchOrders(); // Tải lại danh sách đơn hàng
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu trả hàng:", error);
      alert("Có lỗi xảy ra khi gửi yêu cầu trả hàng");
    }
  };

  // Hàm để hiển thị thông tin sản phẩm một cách an toàn
  const renderProductInfo = (item) => {
    // Kiểm tra xem item có phải là object không
    if (!item || typeof item !== 'object') {
      return <p className="product__error">Không có thông tin sản phẩm</p>;
    }
    
    const name = item.name || 'Không có tên sản phẩm';
    const brand = item.brand || 'Không có thương hiệu';
    const color = item.color || 'Không xác định';
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    const image = item.image || '';
    
    return (
      <div className="product">
        <div className="product__image-container">
          {image ? (
            <img 
              className="product__image"
              src={image} 
              alt={name} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          ) : (
            <div className="product__no-image">Không có ảnh</div>
          )}
        </div>
        <div className="product__info">
          <h5 className="product__name">{name}</h5>
          <p className="product__detail"><strong>Thương hiệu:</strong> {brand}</p>
          <p className="product__detail"><strong>Màu sắc:</strong> {color}</p>
          
          {item.variant && Object.keys(item.variant).length > 0 && (
            <div className="product__variant">
              {Object.entries(item.variant).map(([key, value]) => (
                <p key={key} className="product__variant-detail"><strong>{key}:</strong> {value}</p>
              ))}
            </div>
          )}
          
          <div className="product__price-info">
            <p className="product__price"><strong>Đơn giá:</strong> {price?.toLocaleString()}đ</p>
            <p className="product__quantity"><strong>Số lượng:</strong> {quantity}</p>
            <p className="product__total"><strong>Thành tiền:</strong> {(price * quantity)?.toLocaleString()}đ</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="manage-delivery">
      <h2 className="manage-delivery__title">Lịch sử giao hàng</h2>
      
      <div className="manage-delivery__filters">
        <input
          type="date"
          className="manage-delivery__filter-input"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <select
          className="manage-delivery__filter-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Đã giao">Đã giao</option>
          <option value="Đã hoàn thành">Đã hoàn thành</option>
          <option value="Đã hủy">Đã hủy</option>
        </select>
      </div>

      <div className="manage-delivery__list">
        {filterOrders().length > 0 ? (
          filterOrders().map((order) => (
            <div key={order._id} className="manage-delivery__item">
              <div className="manage-delivery__info">
                <h3 className="manage-delivery__order-code">Đơn hàng #{order.order_code}</h3>
                <p className="manage-delivery__detail"><strong>Khách hàng:</strong> {order.customer_id?.name}</p>
                <p className="manage-delivery__detail"><strong>Địa chỉ:</strong> {order.customer_id?.address}</p>
                <p className="manage-delivery__detail"><strong>SĐT:</strong> {order.customer_id?.phone}</p>
                <p className="manage-delivery__detail"><strong>Ngày giao:</strong> {new Date(order.updatedAt).toLocaleDateString()}</p>
                <p className="manage-delivery__detail">
                  <strong>Trạng thái:</strong> 
                  <span className={`status status--${
                    order.status === "Đã giao" ? "delivered" : 
                    order.status === "Đã hoàn thành" ? "completed" : "cancelled"
                  }`}>
                    {order.status}
                  </span>
                </p>
                <p className="manage-delivery__detail"><strong>Tổng tiền:</strong> {order.total_price?.toLocaleString()}đ</p>
                
                <div className="manage-delivery__actions">
                  <button 
                    className="manage-delivery__btn manage-delivery__btn--details"
                    onClick={() => handleShowDetails(order)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="manage-delivery__empty">
            <p>Không có đơn hàng nào</p>
          </div>
        )}
      </div>

      {/* Modal chi tiết đơn hàng */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đơn hàng #{selectedOrder?.order_code}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div className="order-details">
              <div className="order-details__section">
                <h4 className="order-details__section-title">Thông tin khách hàng</h4>
                <p className="order-details__detail"><strong>Tên:</strong> {selectedOrder.customer_id?.name}</p>
                <p className="order-details__detail"><strong>SĐT:</strong> {selectedOrder.customer_id?.phone}</p>
                <p className="order-details__detail"><strong>Địa chỉ:</strong> {selectedOrder.customer_id?.address}</p>
                <p className="order-details__detail"><strong>Email:</strong> {selectedOrder.customer_id?.email}</p>
              </div>

              <div className="order-details__section">
                <h4 className="order-details__section-title">Thông tin đơn hàng</h4>
                <p className="order-details__detail"><strong>Mã đơn:</strong> {selectedOrder.order_code}</p>
                <p className="order-details__detail"><strong>Ngày đặt:</strong> {new Date(selectedOrder.order_date).toLocaleString()}</p>
                <p className="order-details__detail"><strong>Ngày cập nhật:</strong> {new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                <p className="order-details__detail">
                  <strong>Người giao hàng:</strong> 
                  {selectedOrder.shipper_id ? 
                    (typeof selectedOrder.shipper_id === 'object' && selectedOrder.shipper_id.name ? 
                      selectedOrder.shipper_id.name : 
                      (typeof selectedOrder.shipper_id === 'string' ? 
                        "ID: " + selectedOrder.shipper_id : 
                        "Không có thông tin")) : 
                    "Chưa có người giao hàng"}
                </p>
                <p className="order-details__detail">
                  <strong>Trạng thái:</strong> 
                  <span className={`status status--${
                    selectedOrder.status === "Đã giao" ? "delivered" : 
                    selectedOrder.status === "Đã hoàn thành" ? "completed" : "cancelled"
                  }`}>
                    {selectedOrder.status}
                  </span>
                </p>
                <p className="order-details__detail"><strong>Phương thức thanh toán:</strong> {selectedOrder.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                <p className="order-details__detail">
                  <strong>Trạng thái thanh toán:</strong> 
                  {selectedOrder.status === "Đã giao" && selectedOrder.paymentMethod === "cash" ? 
                    "Đã thanh toán" : selectedOrder.paymentStatus}
                </p>
              </div>

              <div className="order-details__section">
                <h4 className="order-details__section-title">Danh sách sản phẩm</h4>
                <div className="order-details__product-list">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="order-details__product-item">
                      {renderProductInfo(item)}
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.status === "Đã hủy" && (
                <div className="order-details__section">
                  <h4 className="order-details__section-title">Thông tin hủy đơn</h4>
                  <p className="order-details__detail"><strong>Lý do hủy:</strong> {selectedOrder.cancelReason || "Không có lý do"}</p>
                  <p className="order-details__detail"><strong>Người hủy:</strong> {selectedOrder.cancelledBy || "Không xác định"}</p>
                  <p className="order-details__detail"><strong>Thời gian hủy:</strong> {selectedOrder.cancelledAt ? new Date(selectedOrder.cancelledAt).toLocaleString() : "Không xác định"}</p>
                </div>
              )}

              <div className="order-details__section">
                <h4 className="order-details__section-title">Tổng cộng</h4>
                <div className="order-details__summary">
                  <div className="order-details__summary-row">
                    <span>Tổng tiền hàng:</span>
                    <span>{selectedOrder.total_price?.toLocaleString()}đ</span>
                  </div>
                  {selectedOrder.shippingFee > 0 && (
                    <div className="order-details__summary-row">
                      <span>Phí vận chuyển:</span>
                      <span>{selectedOrder.shippingFee?.toLocaleString()}đ</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="order-details__summary-row order-details__summary-row--discount">
                      <span>Giảm giá:</span>
                      <span>-{selectedOrder.discount?.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="order-details__summary-row order-details__summary-row--total">
                    <span>Thành tiền:</span>
                    <span>
                      {(selectedOrder.total_price + (selectedOrder.shippingFee || 0) - (selectedOrder.discount || 0))?.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button 
            className="order-details__btn order-details__btn--close"
            onClick={() => setShowModal(false)}
          >
            Đóng
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DeliveryHistory;