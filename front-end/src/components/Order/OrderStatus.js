import React, { useState } from 'react';
import { updateOrderStatus } from '../../services/orderService';
import './Order.css';

const OrderStatus = ({ order }) => {
    const [status, setStatus] = useState(order.status);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = async () => {
        try {
            setIsUpdating(true);
            await updateOrderStatus(order._id, status);
            // Hiển thị thông báo thành công
            alert('Cập nhật trạng thái đơn hàng thành công!');
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="order-status-container">
            <h3>Cập nhật trạng thái đơn hàng</h3>
            <div className="order-info">
                <p>Mã đơn hàng: {order._id}</p>
                <p>Khách hàng: {order.userEmail}</p>
            </div>
            <div className="status-update">
                <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isUpdating}
                >
                    <option value="pending">Đang chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="shipped">Đã giao hàng</option>
                    <option value="delivered">Giao hàng thành công</option>
                    <option value="failed">Giao hàng thất bại</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
                <button 
                    onClick={handleStatusUpdate}
                    disabled={isUpdating}
                >
                    {isUpdating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                </button>
            </div>
        </div>
    );
};

export default OrderStatus; 