import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./VerifyEmail.css"; // Import CSS mới

const VerifyEmail = () => {
  const { token } = useParams(); // Lấy token từ URL
  const navigate = useNavigate(); // Dùng để điều hướng trang
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const { data } = await axios.post(`http://localhost:9999/api/users/verify-email/${token}`);
        setStatus("success");
        setMessage(data.message);
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="verify-container">
      {status === "loading" && (
        <>
          <h2>Đang xác minh email...</h2>
          <div className="spinner"></div>
        </>
      )}

      {status === "success" && (
        <>
          <div className="message success">{message}</div>
          <button className="verify-button success-button" onClick={() => navigate("/login")}>
            Đăng nhập ngay
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="message error">{message}</div>
          <button className="verify-button error-button" onClick={() => navigate("/")}>
            Quay lại Trang chủ
          </button>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
