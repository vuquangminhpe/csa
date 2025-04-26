import { Link } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <div className="user-sidebar">
      <h4 className="user-sidebar__title">Tài khoản</h4>
      <ul className="user-sidebar__menu">
        <li className="user-sidebar__item">
          <Link to="/account/profile" className="user-sidebar__link">Thông tin tài khoản</Link>
        </li>
        <li className="user-sidebar__item">
          <Link to="/account/order-history" className="user-sidebar__link">Lịch sử đơn hàng</Link>
        </li>
        <li className="user-sidebar__item">
          <Link to="/account/change-password" className="user-sidebar__link">Đổi mật khẩu</Link>
        </li>
      </ul>
    </div>
  );
}
