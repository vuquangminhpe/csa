import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    image: "",
    phone: "",
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/login");
          return;
        }
        const { data } = await axios.get("http://localhost:9999/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          name: data.name || "",
          address: data.address || "",
          image: data.image || "",
          phone: data.phone || "",
        });
        setPreview(data.image || "https://example.com/default-avatar.png");
      } catch (err) {
        setError("Không thể tải thông tin người dùng");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.put(
        "http://localhost:9999/api/users/profile",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate("/account/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) {
      errors.name = "Họ tên không được để trống";
    }
    if (!formData.address) {
      errors.address = "Địa chỉ không được để trống";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Chỉnh sửa thông tin</h2>
        {error && <p style={styles.error}>{error}</p>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.imageSection}>
            <img src={preview} alt="Preview" style={styles.avatar} />
            <div style={styles.uploadContainer}>
              <label htmlFor="fileInput" style={styles.uploadLabel}>
                Chọn ảnh đại diện
              </label>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={styles.fileInput}
              />
            </div>
          </div>

          <div style={styles.formSection}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Họ Tên:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
                placeholder="Nhập họ tên"
              />
              {validationErrors.name && (
                <p style={styles.validationError}>{validationErrors.name}</p>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Số điện thoại:</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={styles.input}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Địa chỉ:</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={styles.textarea}
                placeholder="Nhập địa chỉ"
              />
              {validationErrors.address && (
                <p style={styles.validationError}>{validationErrors.address}</p>
              )}
            </div>

            <div style={styles.buttonGroup}>
              <button 
                type="submit" 
                disabled={loading}
                style={styles.submitButton}
              >
                {loading ? "Đang cập nhật..." : "Cập nhật"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/account/profile")}
                style={styles.cancelButton}
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '10px',
    maxWidth: '350px',
    margin: '80px auto 60px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '10px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '10px',
    color: '#333',
    fontSize: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  imageSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '6px',
  },
  avatar: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginBottom: '5px',
  },
  label: {
    fontWeight: '500',
    color: '#555',
    fontSize: '14px',
  },
  input: {
    padding: '5px 8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '13px',
  },
  textarea: {
    padding: '5px 8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '13px',
    minHeight: '45px',
    resize: 'vertical',
  },
  buttonGroup: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    marginTop: '8px',
  },
  submitButton: {
    padding: '5px 14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  cancelButton: {
    padding: '5px 14px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  phoneError: {
    color: '#ff4d4f',
    fontSize: '11px',
    marginTop: '2px',
    marginBottom: '0',
  },
  error: {
    color: '#ff4d4f',
    textAlign: 'center',
    marginBottom: '6px',
    fontSize: '11px',
  },
  uploadContainer: {
    textAlign: 'center',
  },
  uploadLabel: {
    padding: '4px 10px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  fileInput: {
    display: 'none',
  },
  validationError: {
    color: '#ff4d4f',
    fontSize: '11px',
    marginTop: '2px',
    marginBottom: '0',
  },
};
