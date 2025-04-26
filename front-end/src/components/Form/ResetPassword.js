import React, { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./AuthForm.css"; // Sử dụng CSS chung

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
  
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu và mật khẩu xác nhận không khớp.");
      return;
    }
  
    try {
      const response = await axios.post(`http://localhost:9999/api/users/reset-password/${token}`, {
        newPassword: password,
      });
  
      setMessage(response.data.message || "Mật khẩu đã được đặt lại thành công!");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại sau.");
    }
  };
  

  return (
    <div className="auth-container">
      <h2>Đặt lại mật khẩu</h2>
      <form onSubmit={handleResetPassword} className="auth-form">
        <div className="input-group">
          <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">Đặt lại mật khẩu</button>
      </form>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ResetPassword;
