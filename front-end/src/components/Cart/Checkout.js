import React, { useState, useEffect } from "react";
import { Container, Form, Row, Col, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken") || "";

  // State để lưu thông tin người dùng, giỏ hàng và mã giảm giá
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [cartItems, setCartItems] = useState([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Lấy thông tin người dùng và giỏ hàng khi component được render
  useEffect(() => {
    if (token) {
      fetchUserInfo();
      fetchCartItems();
    } else {
      navigate("/login"); // Điều hướng về trang đăng nhập nếu chưa đăng nhập
    }
  }, [token]);

  // Lấy thông tin người dùng từ API
  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(
        "http://localhost:9999/api/users/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        setFormData({
          fullName: response.data.name || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
        });
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    }
  };

  // Lấy giỏ hàng từ API
  const fetchCartItems = async () => {
    try {
      const response = await axios.get(
        "http://localhost:9999/api/checkout/cart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCartItems(response.data.cart || []);
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
    }
  };

  // Xử lý thay đổi dữ liệu trong form
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Tính tổng tiền trước giảm giá
  const totalBeforeDiscount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Áp dụng mã giảm giá
  const applyDiscount = async () => {
    try {
      const response = await axios.post(
        "http://localhost:9999/api/checkout/discount",
        { discountCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.discount) {
        setDiscountAmount(response.data.discount.calculatedAmount);
        setSuccess("Mã giảm giá đã được áp dụng thành công!");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Mã giảm giá không hợp lệ hoặc đã hết hạn."
      );
      setDiscountAmount(0);
    }
  };

  // Xử lý submit đơn hàng
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Kiểm tra thông tin người nhận trước khi thanh toán
    if (!formData.fullName || !formData.phone || !formData.address) {
      setError("Vui lòng điền đầy đủ thông tin người nhận (Họ tên, Số điện thoại, Địa chỉ)");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/checkout",
        {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          paymentMethod: paymentMethod === "bank_transfer" ? "payos" : "cash"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (paymentMethod === "bank_transfer" && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        setSuccess("Đơn hàng đã được đặt thành công!");
        localStorage.removeItem("cart");
        navigate('/order-processing', { state: { order: response.data.order } });
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Có lỗi xảy ra khi xử lý đơn hàng"
      );
    }
  };

  // Xử lý lưu thông tin
  const handleSaveInfo = async () => {
    try {
      await axios.put(
        "http://localhost:9999/api/users/profile",
        {
          name: formData.fullName,
          phone: formData.phone,
          address: formData.address
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsEditing(false);
      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      alert("Lỗi khi cập nhật thông tin!");
    }
  };

  return (
    <Container>
      <h2>Thông tin giao hàng</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Thông tin người nhận</h4>
              <Button 
                variant="link" 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Hủy" : "Sửa"}
              </Button>
            </div>

            <Form.Group controlId="fullName">
              <Form.Label>Họ và tên</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập Họ và tên"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </Form.Group>

            <Form.Group controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Nhập Email"
                name="email"
                value={formData.email}
                disabled={true}
              />
            </Form.Group>

            <Form.Group controlId="phone">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </Form.Group>

            <Form.Group controlId="address">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập Địa chỉ"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </Form.Group>

            {isEditing && (
              <Button 
                variant="primary" 
                onClick={handleSaveInfo}
                className="mt-3"
              >
                Lưu thông tin
              </Button>
            )}

            {/* Chọn phương thức thanh toán */}
            <Form.Group controlId="paymentMethod">
              <Form.Label>Phương thức thanh toán</Form.Label>
              <Form.Check
                type="radio"
                label="Tiền mặt khi nhận hàng (COD)"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <Form.Check
                type="radio"
                label="Chuyển khoản qua PayOS"
                name="paymentMethod"
                value="bank_transfer"
                checked={paymentMethod === "bank_transfer"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            {/* Tóm tắt đơn hàng */}
            <div className="order-summary">
              <h3>Tóm tắt đơn hàng</h3>
              {cartItems.map((item) => (
                <div className="order-item" key={item.product_id}>
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="item-details">
  <h4>{item.name} ({item.brand})</h4>
  <p className="selected-color">
    <span className="color-label">Màu sắc:</span>
    {item.selected_color || item.color || 'Không xác định'}
  </p>
  {/* Hiển thị thông tin biến thể */}
  {item.variant && (
    <div className="variant-info">
      {item.variant.storage && <p>Dung lượng: {item.variant.storage}</p>}
      {item.variant.length && <p>Chiều dài: {item.variant.length}</p>}
      {item.variant.material && <p>Chất liệu: {item.variant.material}</p>}
      {item.variant.charger && <p>Loại sạc: {item.variant.charger}</p>}
    </div>
  )}
  <p>Giá: {item.price.toLocaleString()} VND</p>
  <p>Số lượng: {item.quantity}</p>
  <p>Tổng: {(item.price * item.quantity).toLocaleString()} VND</p>
</div>
                </div>
              ))}

              {/* Mã giảm giá */}
              <Form.Group controlId="discountCode">
                <Form.Label>Mã giảm giá</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập mã giảm giá"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
                <Button
                  variant="success"
                  type="button"
                  onClick={applyDiscount}
                  className="mt-2"
                >
                  Áp dụng mã giảm giá
                </Button>
              </Form.Group>

              {/* Tổng tiền */}
              <div className="order-total">
                <p>
                    <span>Tổng cộng:</span>
                    <span className="total-amount">
                        {totalBeforeDiscount.toLocaleString('vi-VN')} VNĐ
                    </span>
                </p>

                {discountAmount > 0 && (
                    <p>
                        <span>Giảm giá:</span>
                        <span className="total-amount">
                            -{discountAmount.toLocaleString('vi-VN')} VNĐ
                        </span>
                    </p>
                )}

                <p className="final-amount">
                    <span>Tổng thanh toán:</span>
                    <span>
                        {(totalBeforeDiscount - discountAmount).toLocaleString('vi-VN')} VNĐ
                    </span>
                </p>
              </div>
            </div>
          </Col>
        </Row>

        {/* Nút xử lý đơn hàng */}
        <div className="order-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate("/cart")}
          >
            Quay lại giỏ hàng
          </Button>
          <Button variant="primary" type="submit">
            Hoàn tất đơn hàng
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default Checkout;
