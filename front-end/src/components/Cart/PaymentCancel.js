import React, { useEffect, useState } from "react";
import { Container, Button, Alert } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const orderCode = queryParams.get("orderCode");
    const status = queryParams.get("status");
    const transactionId = queryParams.get("transactionId");

    // Gọi API để cập nhật trạng thái đơn hàng thất bại
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
      <h2>Thanh toán thất bại!</h2>
      {message && <Alert variant="info">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <p>Đơn hàng của bạn chưa được thanh toán thành công.</p>
      <div className="mt-4">
        <Button 
          variant="primary" 
          className="me-3" 
          onClick={() => navigate("/checkout")}
        >
          Thử lại thanh toán
        </Button>
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate("/cart")}
        >
          Quay lại giỏ hàng
        </Button>
      </div>
    </Container>
  );
};

export default PaymentCancel;
