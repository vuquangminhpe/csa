import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './OrderProcessing.css';

const OrderProcessing = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');
    const token = localStorage.getItem('authToken');

    useEffect(() => {
        // Lấy orderId từ state của location (được truyền từ trang Checkout)
        const orderData = location.state?.order;
        if (orderData) {
            setOrder(orderData);
        }
    }, [location]);

    if (!order) {
        return (
            <Container className="text-center mt-5">
                <Alert variant="warning">
                    Không tìm thấy thông tin đơn hàng
                </Alert>
                <Button 
                    variant="primary" 
                    onClick={() => navigate('/cart')}
                >
                    Quay lại giỏ hàng
                </Button>
            </Container>
        );
    }

    return (
        <Container className="order-processing mt-5">
            <Card>
                <Card.Header as="h4" className="text-center">
                    Đặt hàng thành công!
                </Card.Header>
                <Card.Body>
                    <Alert variant="success">
                        Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
                    </Alert>

                    <div className="order-details">
                        <h5>Chi tiết đơn hàng #{order.order_code}</h5>
                        <p><strong>Trạng thái:</strong> {order.status}</p>
                        <p><strong>Phương thức thanh toán:</strong> Tiền mặt khi nhận hàng (COD)</p>
                        <p><strong>Tổng tiền:</strong> {order.total_price.toLocaleString('vi-VN')} VNĐ</p>
                        {order.discount > 0 && (
                            <p><strong>Giảm giá:</strong> {order.discount.toLocaleString('vi-VN')} VNĐ</p>
                        )}
                        <p><strong>Thành tiền:</strong> {(order.total_price - order.discount).toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                </Card.Body>
                <Card.Footer className="text-center">
                    <Button 
                        variant="primary" 
                        className="me-3"
                        onClick={() => navigate('/')}
                    >
                        Tiếp tục mua sắm
                    </Button>
                    <Button 
                        variant="outline-primary"
                        onClick={() => navigate('/orders')}
                    >
                        Xem đơn hàng của tôi
                    </Button>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default OrderProcessing; 