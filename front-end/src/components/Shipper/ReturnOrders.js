import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import axios from "axios";
import "./ManageDelivery.css"; // Sử dụng file CSS chung

function ReturnOrders() {
  const [returnOrders, setReturnOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReturnOrders();
  }, []);

  const fetchReturnOrders = async () => {
    try {
      setLoading(true);
      // Giả sử API endpoint này trả về các đơn hàng có yêu cầu trả
      const response = await axios.get("http://localhost:9999/api/orders/returns");
      setReturnOrders(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng trả:", error);
      setError("Không thể tải danh sách đơn hàng trả. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  const handleShowDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleAcceptReturn = async (orderId) => {
    try {
      await axios.put(`http://localhost:9999/api/orders/${orderId}/return-status`, {
        status: "Đã chấp nhận"
      });
      alert("Đã chấp nhận yêu cầu trả hàng!");
      fetchReturnOrders(); // Tải lại danh sách
    } catch (error) {
      console.error("Lỗi khi chấp nhận trả hàng:", error);
      alert("Có lỗi xảy ra khi xử lý yêu cầu");
    }
  };

  const handleRejectReturn = async (orderId) => {
    try {
      await axios.put(`http://localhost:9999/api/orders/${orderId}/return-status`, {
        status: "Đã từ chối"
      });
      alert("Đã từ chối yêu cầu trả hàng!");
      fetchReturnOrders(); // Tải lại danh sách
    } catch (error) {
      console.error("Lỗi khi từ chối trả hàng:", error);
      alert("Có lỗi xảy ra khi xử lý yêu cầu");
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
      <h2 className="manage-delivery__title">Đơn hàng trả</h2>
      
      {loading ? (
        <div className="manage-delivery__loading">Đang tải...</div>
      ) : error ? (
        <div className="manage-delivery__error">{error}</div>
      ) : returnOrders.length === 0 ? (
        <div className="manage-delivery__empty">
          <p>Không có đơn hàng trả nào</p>
        </div>
      ) : (
        <div className="manage-delivery__list">
          {returnOrders.map((order) => (
            <div key={order._id} className="manage-delivery__item">
              <div className="manage-delivery__info">
                <h3 className="manage-delivery__order-code">Đơn hàng #{order.order_code}</h3>
                <p className="manage-delivery__detail"><strong>Khách hàng:</strong> {order.customer_id?.name}</p>
                <p className="manage-delivery__detail"><strong>Địa chỉ:</strong> {order.customer_id?.address}</p>
                <p className="manage-delivery__detail"><strong>SĐT:</strong> {order.customer_id?.phone}</p>
                <p className="manage-delivery__detail"><strong>Ngày yêu cầu trả:</strong> {new Date(order.returnRequest?.requestDate).toLocaleDateString()}</p>
                <p className="manage-delivery__detail">
                  <strong>Trạng thái yêu cầu:</strong> 
                  <span className={`status status--${order.returnRequest?.status === "Đã chấp nhận" ? "accepted" : order.returnRequest?.status === "Đã từ chối" ? "rejected" : "pending"}`}>
                    {order.returnRequest?.status || "Đang xử lý"}
                  </span>
                </p>
                <p className="manage-delivery__detail"><strong>Lý do trả:</strong> {order.returnRequest?.reason}</p>
                <p className="manage-delivery__detail"><strong>Tổng tiền:</strong> {order.total_price?.toLocaleString()}đ</p>
                
                <div className="manage-delivery__actions">
                  <button 
                    className="manage-delivery__btn manage-delivery__btn--details"
                    onClick={() => handleShowDetails(order)}
                  >
                    Xem chi tiết
                  </button>
                  
                  {order.returnRequest?.status === "Đang xử lý" && (
                    <>
                      <button 
                        className="manage-delivery__btn manage-delivery__btn--accept"
                        onClick={() => handleAcceptReturn(order._id)}
                      >
                        Chấp nhận
                      </button>
                      <button 
                        className="manage-delivery__btn manage-delivery__btn--reject"
                        onClick={() => handleRejectReturn(order._id)}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  <strong>Trạng thái:</strong> 
                  <span className="status status--delivered">
                    {selectedOrder.status}
                  </span>
                </p>
              </div>

              <div className="order-details__section">
                <h4 className="order-details__section-title">Thông tin trả hàng</h4>
                <p className="order-details__detail"><strong>Ngày yêu cầu:</strong> {new Date(selectedOrder.returnRequest?.requestDate).toLocaleString()}</p>
                <p className="order-details__detail"><strong>Lý do trả hàng:</strong> {selectedOrder.returnRequest?.reason}</p>
                <p className="order-details__detail">
                  <strong>Trạng thái yêu cầu:</strong> 
                  <span className={`status status--${selectedOrder.returnRequest?.status === "Đã chấp nhận" ? "accepted" : selectedOrder.returnRequest?.status === "Đã từ chối" ? "rejected" : "pending"}`}>
                    {selectedOrder.returnRequest?.status || "Đang xử lý"}
                  </span>
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
          
          {selectedOrder && selectedOrder.returnRequest?.status === "Đang xử lý" && (
            <>
              <button 
                className="order-details__btn order-details__btn--accept"
                onClick={() => {
                  handleAcceptReturn(selectedOrder._id);
                  setShowModal(false);
                }}
              >
                Chấp nhận trả hàng
              </button>
              <button 
                className="order-details__btn order-details__btn--reject"
                onClick={() => {
                  handleRejectReturn(selectedOrder._id);
                  setShowModal(false);
                }}
              >
                Từ chối trả hàng
              </button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ReturnOrders; 