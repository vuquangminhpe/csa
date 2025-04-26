import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        console.log("Token đang gửi:", token);

        const { data } = await axios.get("http://localhost:9999/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(data);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin user:", err.response?.data || err.message);
        setError("Lỗi khi lấy thông tin user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) return <p>Đang tải thông tin...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Thông tin tài khoản</h2>
      <div style={styles.profileCard}>
        <img src={user.image || "https://example.com/default-avatar.png"} alt="Avatar" style={styles.avatar} />
        <div style={styles.info}>
          <p><strong>Họ Tên:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Số điện thoại:</strong> {user.phone || "Chưa có"}</p>
          <p><strong>Địa chỉ:</strong> {user.address || "Chưa cập nhật"}</p>
        </div>
        <button  
          onClick={() => navigate("/account/profile/edit")}
          style={{...styles.editButton, backgroundColor: '#dc3545', borderColor: '#dc3545'}}
        >
          Chỉnh sửa thông tin
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    padding: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  profileCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#f9f9f9",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
    maxWidth: "400px",
    margin: "auto",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    marginBottom: "15px",
  },
  info: {
    fontSize: "16px",
    lineHeight: "1.5",
  },
  editButton: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
