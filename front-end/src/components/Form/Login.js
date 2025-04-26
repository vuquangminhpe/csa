import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthForm.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Xử lý đăng nhập thông thường
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      const { token, user } = response.data;

      // Lưu token và user vào localStorage nếu cần
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      setSuccessMessage(`Chào mừng, ${user.name}!`);

      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="auth-container">
      <h2>ĐĂNG NHẬP</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <input
            type="email"
            placeholder="Email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <button type="submit" className="auth-button">Đăng nhập</button>

        <div className="auth-links">
          <Link to="/forgot-password" className="forgot-password-link">Quên mật khẩu?</Link>
          <span> | </span>
          <Link to="/register" className="register-link">Đăng ký ngay</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;