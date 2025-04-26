import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import axios from "axios";
import "./ManageDelivery.css";

function ManageDelivery({ status }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [status]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/orders");
      console.log("API response:", response.data);
      
      if (response.data.data && response.data.data.length > 0) {
        const sampleOrder = response.data.data[0];
        console.log("Sample order:", sampleOrder);
        
        if (sampleOrder.items && sampleOrder.items.length > 0) {
          const sampleItem = sampleOrder.items[0];
          console.log("Sample item:", sampleItem);
          console.log("Brand value:", sampleItem.brand);
        }
      }
      
      const allOrders = response.data.data;
      
      // Kiểm tra cấu trúc dữ liệu của một đơn hàng
      if (allOrders && allOrders.length > 0) {
        console.log("Sample order:", allOrders[0]);
        console.log("Sample order items:", allOrders[0].items);
        
        // Kiểm tra thông tin sản phẩm
        if (allOrders[0].items && allOrders[0].items.length > 0) {
          console.log("Sample product in order:", allOrders[0].items[0]);
          console.log("Product ID reference:", allOrders[0].items[0].product_id);
        }
      }
      
      // Tiếp tục xử lý như bình thường
      let filteredOrders;
      if (status === "pending") {
        filteredOrders = allOrders.filter(order => order.status === "Đã xác nhận");
      } else if (status === "active") {
        filteredOrders = allOrders.filter(order => order.status === "Đang giao");
      }
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
    }
  };

  const handleShowDetails = (order) => {
    // Log để kiểm tra đơn hàng được chọn
    console.log("Đơn hàng được chọn:", order);
    console.log("Items trong đơn hàng được chọn:", order.items);
    
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      // Lấy thông tin shipper từ localStorage đúng cách
      const userString = localStorage.getItem('user');
      let shipperId = null;
      
      if (userString) {
        const userData = JSON.parse(userString);
        console.log("User data from localStorage:", userData);
        
        // Kiểm tra cấu trúc dữ liệu và lấy ID
        if (userData._id) {
          shipperId = userData._id;
        }
      }
      
      console.log("Shipper ID extracted:", shipperId);
      
      // Nếu không tìm thấy ID, sử dụng ID cứng cho mục đích kiểm thử
      // if (!shipperId) {
      //   console.log("Using hardcoded shipper ID as fallback");
      //   shipperId = "67a2d65d5eeb5b7d8d7f1e85"; // ID của Trần Văn Giao
      // }
      
      const response = await axios.put(`http://localhost:9999/api/orders/${orderId}/status`, {
        status: "Đang giao",
        shipper_id: shipperId
      });
      
      console.log("Accept order response:", response.data);
      alert("Đã nhận đơn hàng thành công!");
      fetchOrders();
    } catch (error) {
      console.error("Lỗi khi nhận đơn:", error);
      alert("Có lỗi xảy ra khi nhận đơn hàng");
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      // Lấy thông tin shipper từ localStorage đúng cách
      const userString = localStorage.getItem('user');
      let shipperId = null;
      
      if (userString) {
        const userData = JSON.parse(userString);
        if (userData._id) {
          shipperId = userData._id;
        }
      }
      
      // Nếu không tìm thấy ID, sử dụng ID cứng
      if (!shipperId) {
        shipperId = "67a2d65d5eeb5b7d8d7f1e85";
      }
      
      await axios.put(`http://localhost:9999/api/orders/${orderId}/status`, {
        status: "Đã giao",
        shipper_id: shipperId
      });
      
      alert("Đã hoàn thành đơn hàng!");
      fetchOrders();
    } catch (error) {
      console.error("Lỗi khi hoàn thành đơn:", error);
      alert("Có lỗi xảy ra khi hoàn thành đơn hàng");
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      // Lấy thông tin shipper từ localStorage đúng cách
      const userString = localStorage.getItem('user');
      let shipperId = null;
      
      if (userString) {
        const userData = JSON.parse(userString);
        if (userData._id) {
          shipperId = userData._id;
        }
      }
      
      // Nếu không tìm thấy ID, sử dụng ID cứng
      if (!shipperId) {
        shipperId = "67a2d65d5eeb5b7d8d7f1e85";
      }
      
      const reason = prompt("Nhập lý do hủy đơn hàng:");
      if (!reason) return;
      
      await axios.put(`http://localhost:9999/api/orders/${orderId}/status`, {
        status: "Đã hủy",
        cancelReason: reason,
        cancelledBy: "Shipper",
        cancelledAt: new Date(),
        shipper_id: shipperId
      });
      
      alert("Đã hủy đơn hàng!");
      fetchOrders();
    } catch (error) {
      console.error("Lỗi khi hủy đơn:", error);
      alert("Có lỗi xảy ra khi hủy đơn hàng");
    }
  };

  // Hàm để hiển thị thông tin sản phẩm một cách an toàn
  const renderProductInfo = (item) => {
    console.log("Rendering item:", item);
    
    // Kiểm tra xem item có phải là object không
    if (!item || typeof item !== 'object') {
      return <p className="product__error">Không có thông tin sản phẩm</p>;
    }
    
    // Kiểm tra các trường hợp cấu trúc dữ liệu khác nhau
    const name = item.name || 
                (item.product_id && typeof item.product_id === 'object' ? item.product_id.name : '') || 
                'Không có tên sản phẩm';
    
    // Xử lý brand có thể là string hoặc object
    let brand = 'Không có thương hiệu';
    if (item.brand) {
      brand = typeof item.brand === 'object' && item.brand.name ? item.brand.name : item.brand;
    } else if (item.product_id && typeof item.product_id === 'object') {
      if (item.product_id.brand) {
        brand = typeof item.product_id.brand === 'object' && item.product_id.brand.name ? 
                item.product_id.brand.name : item.product_id.brand;
      }
    }
    
    const color = item.color || 
                 (item.product_id && typeof item.product_id === 'object' && item.product_id.colors ? item.product_id.colors[0] : '') || 
                 'Không xác định';
    
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    
    // Xử lý image
    let image = '';
    if (item.image) {
      image = item.image;
    } else if (item.product_id && typeof item.product_id === 'object') {
      if (item.product_id.images && item.product_id.images.length > 0) {
        image = item.product_id.images[0];
      }
    }
    
    // Xử lý variant
    let variantInfo = [];
    
    // Kiểm tra variant trong item
    if (item.variant && typeof item.variant === 'object' && Object.keys(item.variant).length > 0) {
      Object.entries(item.variant).forEach(([key, value]) => {
        if (value) { // Chỉ thêm nếu có giá trị
          let displayKey = key.charAt(0).toUpperCase() + key.slice(1);
          
          // Xử lý các trường hợp đặc biệt
          if (key.toLowerCase() === 'storage' || key.toLowerCase() === 'capacity' || key.toLowerCase() === 'dungluong') {
            displayKey = 'Dung lượng';
          } else if (key.toLowerCase() === 'chargertype' || key.toLowerCase() === 'loaisac') {
            displayKey = 'Loại sạc';
          } else if (key.toLowerCase() === 'ram') {
            displayKey = 'RAM';
          } else if (key.toLowerCase() === 'size') {
            displayKey = 'Kích thước';
          } else if (key.toLowerCase() === 'material') {
            displayKey = 'Chất liệu';
          }
          
          variantInfo.push({ key: displayKey, value });
        }
      });
    }
    
    // Kiểm tra selectedVariant
    if (item.selectedVariant && typeof item.selectedVariant === 'object' && Object.keys(item.selectedVariant).length > 0) {
      Object.entries(item.selectedVariant).forEach(([key, value]) => {
        if (value) {
          let displayKey = key.charAt(0).toUpperCase() + key.slice(1);
          
          // Xử lý các trường hợp đặc biệt
          if (key.toLowerCase() === 'storage' || key.toLowerCase() === 'capacity' || key.toLowerCase() === 'dungluong') {
            displayKey = 'Dung lượng';
          } else if (key.toLowerCase() === 'chargertype' || key.toLowerCase() === 'loaisac') {
            displayKey = 'Loại sạc';
          } else if (key.toLowerCase() === 'ram') {
            displayKey = 'RAM';
          } else if (key.toLowerCase() === 'size') {
            displayKey = 'Kích thước';
          } else if (key.toLowerCase() === 'material') {
            displayKey = 'Chất liệu';
          }
          
          // Kiểm tra xem key này đã tồn tại trong variantInfo chưa
          const existingIndex = variantInfo.findIndex(v => v.key.toLowerCase() === displayKey.toLowerCase());
          if (existingIndex === -1) {
            variantInfo.push({ key: displayKey, value });
          }
        }
      });
    }
    
    // Nếu không có variant trong item, tìm trong product_id.variants
    if (variantInfo.length === 0 && item.product_id && item.product_id.variants && Array.isArray(item.product_id.variants)) {
      // Tìm variant phù hợp với giá
      const matchedVariant = item.product_id.variants.find(v => v.price === item.price);
      
      if (matchedVariant) {
        Object.entries(matchedVariant).forEach(([key, value]) => {
          // Bỏ qua các trường không phải thuộc tính variant
          if (key !== '_id' && key !== 'price' && key !== 'stock' && value) {
            let displayKey = key.charAt(0).toUpperCase() + key.slice(1);
            
            // Xử lý các trường hợp đặc biệt
            if (key.toLowerCase() === 'storage' || key.toLowerCase() === 'capacity' || key.toLowerCase() === 'dungluong') {
              displayKey = 'Dung lượng';
            } else if (key.toLowerCase() === 'chargertype' || key.toLowerCase() === 'loaisac') {
              displayKey = 'Loại sạc';
            } else if (key.toLowerCase() === 'ram') {
              displayKey = 'RAM';
            } else if (key.toLowerCase() === 'size') {
              displayKey = 'Kích thước';
            } else if (key.toLowerCase() === 'material') {
              displayKey = 'Chất liệu';
            }
            
            variantInfo.push({ key: displayKey, value });
          }
        });
      }
    }
    
    console.log("Processed image URL:", image);
    console.log("Processed brand:", brand);
    console.log("Variant info:", variantInfo);
    
    return (
      <div className="product">
        <div className="product__image-container">
          {image ? (
            <img 
              className="product__image"
              src={image} 
              alt={name} 
              onError={(e) => {
                console.log("Image error:", image);
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
          
          {variantInfo.length > 0 && (
            <div className="product__detail">
              {variantInfo.map((variant, index) => (
                <p key={index} className="product__variant-detail">
                  <strong>{variant.key}:</strong> {variant.value}
                </p>
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

  // Hàm để hiển thị thông tin sản phẩm trong preview
  const renderProductPreview = (item) => {
    console.log("Rendering preview item:", item);
    
    // Kiểm tra xem item có phải là object không
    if (!item || typeof item !== 'object') {
      return <p>Không có thông tin sản phẩm</p>;
    }
    
    // Kiểm tra các trường hợp cấu trúc dữ liệu khác nhau
    const name = item.name || 
                (item.product_id && typeof item.product_id === 'object' ? item.product_id.name : '') || 
                'Không có tên sản phẩm';
    
    const brand = item.brand || 
                 (item.product_id && typeof item.product_id === 'object' && item.product_id.brand ? item.product_id.brand : '') || 
                 'Không có thương hiệu';
    
    const color = item.color || 
                 (item.product_id && typeof item.product_id === 'object' && item.product_id.colors ? item.product_id.colors[0] : '') || 
                 'Không xác định';
    
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    
    // Thêm xử lý đặc biệt cho trường image
    let image = '';
    if (item.image) {
      image = item.image;
    } else if (item.product_id && typeof item.product_id === 'object') {
      if (item.product_id.images && item.product_id.images.length > 0) {
        image = item.product_id.images[0];
      } else if (item.product_id.image) {
        image = item.product_id.image;
      }
    }
    
    return (
      <div className="order-item-preview">
        <div className="item-preview-image">
          {image ? (
            <img 
              src={image} 
              alt={name} 
              onError={(e) => {
                console.log("Preview image error:", image);
                e.target.onerror = null;
                e.target.src = '/placeholder-image.jpg';
              }} 
            />
          ) : (
            <div className="no-image">Không có ảnh</div>
          )}
        </div>
        <div className="item-preview-info">
          <p className="item-name">{name}</p>
          <p className="item-brand">Thương hiệu: {brand}</p>
          <p className="item-color">Màu: {color}</p>
          <p className="item-quantity">SL: {quantity}</p>
          <p className="item-price">Giá: {price?.toLocaleString()}đ</p>
        </div>
      </div>
    );
  };

  return (
    <div className="manage-delivery">
      <h2 className="manage-delivery__title">
        {status === "pending" ? "Đơn hàng chờ giao" : "Đơn hàng đang giao"}
      </h2>
      
      <div className="manage-delivery__list">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div key={order._id} className="manage-delivery__item">
              <div className="manage-delivery__info">
                <h3 className="manage-delivery__order-code">Đơn hàng #{order.order_code}</h3>
                <p className="manage-delivery__detail"><strong>Khách hàng:</strong> {order.customer_id?.name}</p>
                <p className="manage-delivery__detail"><strong>Địa chỉ:</strong> {order.customer_id?.address}</p>
                <p className="manage-delivery__detail"><strong>SĐT:</strong> {order.customer_id?.phone}</p>
                <p className="manage-delivery__detail"><strong>Ngày đặt:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                
                <p className="manage-delivery__detail"><strong>Tổng tiền:</strong> {order.total_price?.toLocaleString()}đ</p>
                
                <div className="manage-delivery__actions">
                  <button 
                    className="manage-delivery__btn manage-delivery__btn--details"
                    onClick={() => handleShowDetails(order)}
                  >
                    Xem chi tiết
                  </button>
                  
                  {status === "pending" && (
                    <button 
                      className="manage-delivery__btn manage-delivery__btn--accept"
                      onClick={() => handleAcceptOrder(order._id)}
                    >
                      Nhận đơn
                    </button>
                  )}
                  
                  {status === "active" && (
                    <>
                      <button 
                        className="manage-delivery__btn manage-delivery__btn--complete"
                        onClick={() => handleCompleteOrder(order._id)}
                      >
                        Hoàn thành
                      </button>
                      <button 
                        className="manage-delivery__btn manage-delivery__btn--cancel"
                        onClick={() => handleCancelOrder(order._id)}
                      >
                        Hủy đơn
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="manage-delivery__no-orders">Không có đơn hàng nào</p>
        )}
      </div>
      
      {/* Modal hiển thị chi tiết đơn hàng */}
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
                  <span className={`status status--${selectedOrder.status.replace(/\s+/g, '').toLowerCase()}`}>
                    {selectedOrder.status}
                  </span>
                </p>
                <p className="order-details__detail"><strong>Phương thức thanh toán:</strong> {selectedOrder.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                <p className="order-details__detail">
                  <strong>Trạng thái thanh toán:</strong> 
                  <span className={`status status--${selectedOrder.paymentStatus.replace(/\s+/g, '').toLowerCase()}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </p>
              </div>
              
              <div className="order-details__section">
                <h4 className="order-details__section-title">Danh sách sản phẩm</h4>
                <div className="order-details__product-list">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={index} className="order-details__product-item">
                        {renderProductInfo(item)}
                      </div>
                    ))
                  ) : (
                    <p className="order-details__empty">Không có sản phẩm nào</p>
                  )}
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
          {status === "pending" && (
            <button 
              className="order-details__btn order-details__btn--accept"
              onClick={() => {
                handleAcceptOrder(selectedOrder._id);
                setShowModal(false);
              }}
            >
              Nhận đơn
            </button>
          )}
          
          {status === "active" && (
            <>
              <button 
                className="order-details__btn order-details__btn--complete"
                onClick={() => {
                  handleCompleteOrder(selectedOrder._id);
                  setShowModal(false);
                }}
              >
                Hoàn thành
              </button>
              <button 
                className="order-details__btn order-details__btn--cancel"
                onClick={() => {
                  handleCancelOrder(selectedOrder._id);
                  setShowModal(false);
                }}
              >
                Hủy đơn
              </button>
            </>
          )}
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

export default ManageDelivery; 