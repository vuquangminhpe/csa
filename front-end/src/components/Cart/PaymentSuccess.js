import React, { useEffect, useState } from "react";
import { Container, Button, Alert } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const orderCode = queryParams.get("orderCode");
    const status = queryParams.get("status");
    const transactionId = queryParams.get("transactionId");

    // Gọi API để cập nhật trạng thái đơn hàng
    const updatePaymentStatus = async () => {
      try {
        const response = await axios.post(
          "http://localhost:9999/api/payment/payos-callback",
          {
            orderCode,
            status,
            transactionId
          }
        );
        setMessage(response.data.message);
      } catch (error) {
        setError(error.response?.data?.message || "Có lỗi xảy ra");
      }
    };

    if (orderCode && status) {
      updatePaymentStatus();
    }
  }, [location]);

  return (
    <Container className="text-center mt-5">
      <h2>Thanh toán thành công!</h2>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <p>Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn sớm nhất.</p>
      <div className="mt-4">
        <Button 
          variant="primary" 
          className="me-3" 
          onClick={() => navigate("/")}
        >
          Quay lại Trang chủ
        </Button>
        <Button 
          variant="outline-primary" 
          onClick={() => navigate("/orders")}
        >
          Xem đơn hàng
        </Button>
      </div>
    </Container>
  );
};

export default PaymentSuccess;
