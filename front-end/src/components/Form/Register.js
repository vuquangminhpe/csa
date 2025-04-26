import React, { useState } from "react";
import axios from "axios";
import "./AuthForm.css";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState(""); // Thêm trạng thái hiển thị thông báo
  const [messageType, setMessageType] = useState(""); // success | error
  const [isLoading, setIsLoading] = useState(false); // Trạng thái loading khi đăng ký
  const navigate = useNavigate();

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage(""); // Reset thông báo trước khi submit
    setMessageType("");
    setIsLoading(true); // Hiển thị loading

    // Validate form
    const errors = {};
    let isValid = true;

    if (!emailRegex.test(email)) {
      errors.email = "Địa chỉ email không hợp lệ.";
      isValid = false;
    }

    if (!/^\d{10}$/.test(phone)) {
      errors.phone = "Số điện thoại phải gồm 10 chữ số.";
      isValid = false;
    }

    if (password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      isValid = false;
    }

    if (confirmPassword !== password) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      isValid = false;
    }

    if (isValid) {
      try {
        const response = await axios.post("http://localhost:9999/api/users/register", {
          name: fullName,
          email,
          phone,
          password,
        });
        
        // Sử dụng message từ API backend
        setMessage(response.data.message);
        setMessageType("success");

        // Chuyển hướng sau 3 giây
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";

        // Hiển thị thông báo lỗi từ backend
        setMessage(` ${errorMessage}`);
        setMessageType("error");

        switch (errorMessage) {
          case "Email đã được sử dụng":
            setFormError((prev) => ({
              ...prev,
              email: errorMessage,
            }));
            break;

          // case "Số điện thoại đã được sử dụng":
          //   setFormError((prev) => ({
          //     ...prev,
          //     phone: errorMessage,
          //   }));
          //   break;

          default:
            setFormError((prev) => ({
              ...prev,
              general: errorMessage,
            }));
        }
      }
    } else {
      setFormError(errors);
    }

    setIsLoading(false); // Tắt loading sau khi xử lý xong
  };

  return (
    <div className="auth-container">
      <h2>ĐĂNG KÝ THÀNH VIÊN MỚI</h2>

      {/* Hiển thị thông báo */}
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <input
            type="text"
            placeholder="Họ và Tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formError.email) setFormError((prev) => ({ ...prev, email: "" }));
            }}
            required
          />
          {formError.email && <div className="error-message">{formError.email}</div>}
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (formError.phone) setFormError((prev) => ({ ...prev, phone: "" }));
            }}
            required
          />
          {formError.phone && <div className="error-message">{formError.phone}</div>}
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError.password) setFormError((prev) => ({ ...prev, password: "" }));
            }}
            required
          />
          {formError.password && <div className="error-message">{formError.password}</div>}
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (formError.confirmPassword) setFormError((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            required
          />
          {formError.confirmPassword && <div className="error-message">{formError.confirmPassword}</div>}
        </div>

        <button type="submit" className="auth-button" disabled={isLoading}>
          {isLoading ? "Đang đăng ký..." : "Đăng ký"}
        </button>
      </form>
    </div>
  );
};

export default Register;
