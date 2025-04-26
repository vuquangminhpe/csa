import React, { useState } from 'react';
import Header from "../../components/Common/Header";
import Footer from "../../components/Common/Footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Tạm thời chỉ log ra console
      console.log('Form submitted:', formData);
      setSuccess(true);
      // Tạm thời chỉ log ra console
      console.log('Form submitted:', formData);
    } catch (err) {
      setError('Có lỗi xảy ra, vui lòng thử lại sau');
    } finally {
      setError('Có lỗi xảy ra, vui lòng thử lại sau');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Liên hệ với chúng tôi</h2>
          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>Gửi thông tin thành công!</p>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Họ tên:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={styles.input}
                placeholder="Nhập họ tên của bạn"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={styles.input}
                placeholder="Nhập email của bạn"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Số điện thoại:</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={styles.input}
                placeholder="Nhập số điện thoại của bạn"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tiêu đề:</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                style={styles.input}
                placeholder="Nhập tiêu đề"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nội dung:</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                style={styles.textarea}
                placeholder="Nhập nội dung tin nhắn"
                required
              />
            </div>

            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
            </button>
          </form>
        </div>

        <div style={styles.infoSection}>
          <h3 style={styles.infoTitle}>Thông tin liên hệ</h3>
          <div style={styles.infoItem}>
            <strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, TP.HCM
          </div>
          <div style={styles.infoItem}>
            <strong>Email:</strong> contact@example.com
          </div>
          <div style={styles.infoItem}>
            <strong>Điện thoại:</strong> 0123 456 789
          </div>
          <div style={styles.infoItem}>
            <strong>Giờ làm việc:</strong> 8:00 - 17:00 (Thứ 2 - Thứ 6)
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    flex: '1',
    marginBottom: '20px'
  },
  card: {
    flex: '1',
    minWidth: '280px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '15px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '15px',
    color: '#333',
    fontSize: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontWeight: '500',
    color: '#555',
    fontSize: '13px'
  },
  input: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '13px'
  },
  textarea: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '13px',
    minHeight: '80px',
    resize: 'vertical'
  },
  infoSection: {
    flex: '1',
    minWidth: '280px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '15px'
  },
  infoTitle: {
    color: '#333',
    marginBottom: '12px',
    fontSize: '18px'
  },
  infoItem: {
    marginBottom: '8px',
    fontSize: '13px',
    color: '#666'
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500'
  }
};