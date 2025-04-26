import React, { useState } from "react";
import axios from "axios";
import "./AuthForm.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:9999/api/users/forgot-password", {
        email,
      });
      setMessage(response.data.message);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại sau.");
      setMessage("");
    }
  };

  return (
    <div className="auth-container">
      <h2>Quên mật khẩu</h2>
      <form onSubmit={handleForgotPassword} className="auth-form">
        <div className="input-group">
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-button">
          Gửi yêu cầu
        </button>
      </form>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ForgotPassword;
