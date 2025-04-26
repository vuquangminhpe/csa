import { Navigate } from 'react-router-dom';

const AuthRedirect = ({ children }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  
  // Nếu đã đăng nhập, chuyển hướng về trang chủ
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Nếu chưa đăng nhập, hiển thị component con
  return children;
};

export default AuthRedirect; 