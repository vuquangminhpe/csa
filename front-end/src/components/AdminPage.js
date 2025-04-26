import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";

function AdminAccount() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState(null);
  const [editingRoleValue, setEditingRoleValue] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    axios.get("http://localhost:9999/api/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    })
      .then((res) => setUsers(res.data))
      .catch((err) => {
        console.error(err);
        alert("Không thể tải dữ liệu người dùng. Vui lòng kiểm tra lại token hoặc quyền truy cập.");
      });
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:9999/api/users/logout", null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
    } catch (error) {
      console.error("Lỗi logout:", error);
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleBlockToggle = async (userId, currentStatus) => {
    try {
      await axios.patch(
        `http://localhost:9999/api/users/block/${userId}`,
        { isBlocked: !currentStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
      );
      setUsers(users.map((u) => u._id === userId ? { ...u, isBanned: !currentStatus } : u));
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi block/unblock user");
    }
  };

  const handleEditRole = (user) => {
    setEditingRoleUserId(user._id);
    setEditingRoleValue(user.role?.role || "customer");
  };

  const handleSaveRole = async (userId) => {
    try {
      await axios.patch(
        `http://localhost:9999/api/users/role/${userId}`,
        { newRole: editingRoleValue },
        { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
      );
      alert("Role đã được cập nhật thành công");
      setUsers(users.map((u) =>
        u._id === userId ? { ...u, role: { ...u.role, role: editingRoleValue } } : u
      ));
      setEditingRoleUserId(null);
      setEditingRoleValue("");
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi cập nhật role");
    }
  };

  const handleCancelRoleEdit = () => {
    setEditingRoleUserId(null);
    setEditingRoleValue("");
  };

  return (
    <div className="admin-account">
      <div className="admin-account__sidebar">
        <div className="admin-account__sidebar-title">
          <span className="admin-account__logo">Admin</span> Dashboard
        </div>
        <ul className="admin-account__sidebar-list">
          <li>
            <a href="#" className="active">
              <i className="fas fa-users"></i> Quản lý tài khoản
            </a>
          </li>
          <li>
            <a href="/" onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}>
              <i className="fas fa-home"></i> Trang chủ
            </a>
          </li>
          <li>
            <a href="/manager" onClick={(e) => {
              e.preventDefault();
              navigate('/manager');
            }}>
              <i className="fas fa-tasks"></i> Trang Manager
            </a>
          </li>
          <li>
            <a href="/sale" onClick={(e) => {
              e.preventDefault();
              navigate('/sale');
            }}>
              <i className="fas fa-shopping-cart"></i> Trang Sale
            </a>
          </li>
          <li>
            <a href="/shipper" onClick={(e) => {
              e.preventDefault();
              navigate('/shipper');
            }}>
              <i className="fas fa-truck"></i> Trang Shipper
            </a>
          </li>
        </ul>
      </div>
      <div className="admin-account__main-content">
        <div className="admin-account__header">
          <div className="admin-account__user-info">
            <i className="fas fa-user"></i> Xin chào, {currentUser ? currentUser.name : "User"}
          </div>
          <button onClick={handleLogout} className="admin-account__logout-button">
            Đăng xuất
          </button>
        </div>
        <div className="admin-account__content-box">
          <h2>Danh sách người dùng</h2>
          <table className="admin-account__table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users && users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user._id}>
                    <td>{index + 1}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      {editingRoleUserId === user._id ? (
                        <>
                          <select
                            value={editingRoleValue}
                            onChange={(e) => setEditingRoleValue(e.target.value)}
                          >
                            <option value="customer">Customer</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button onClick={() => handleSaveRole(user._id)} className="admin-account__save-btn">
                            Save
                          </button>
                          <button onClick={handleCancelRoleEdit} className="admin-account__cancel-btn">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span>{user.role?.role || "customer"}</span>
                          <button onClick={() => handleEditRole(user)} className="admin-account__edit-btn">
                            <i className="fas fa-pencil-alt"></i>
                          </button>
                        </>
                      )}
                    </td>
                    <td>{user.isBanned ? 'Blocked' : 'Active'}</td>
                    <td>
                      <button
                        onClick={() => handleBlockToggle(user._id, user.isBanned)}
                        className="admin-account__btn admin-account__btn--warning"
                      >
                        {user.isBanned ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">Không có người dùng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminAccount;