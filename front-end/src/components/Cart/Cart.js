import { useState, useEffect } from "react";
import { Container, Row, Col, Table, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

export default function Cart() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Lấy giỏ hàng từ localStorage khi component mount
    useEffect(() => {
        const cartData = JSON.parse(localStorage.getItem("cart")) || [];
        setCart(cartData);
        setLoading(false);
    }, []);

    // Cập nhật số lượng sản phẩm trong localStorage
    const updateQuantity = (index, newQuantity) => {
        if (newQuantity < 1) return;
        const updatedCart = [...cart];
        updatedCart[index].quantity = newQuantity;
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    // Xóa sản phẩm khỏi giỏ hàng trong localStorage
    const removeFromCart = (index) => {
        const updatedCart = cart.filter((_, i) => i !== index);
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    if (loading) return <h3 className="text-center">Đang tải giỏ hàng...</h3>;
    if (error) return <h3 className="text-center text-danger">{error}</h3>;

    return (
        <Container style={{ minHeight: '40vh' }}>
            <h1 className="text-center">Giỏ Hàng Của Bạn</h1>
            <Row className="my-3">
                <Col xs={12} md={8}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Sản phẩm</th>
                                <th>Giá</th>
                                <th>Ảnh</th>
                                <th>Số lượng</th>
                                <th>Tổng</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.length > 0 ? (
                                cart.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.name}</td>
                                        <td>{item.variants ? item.variants[0].price.toLocaleString() : item.price.toLocaleString()} VNĐ</td>
                                        <td>
                                            <img src={item.images ? item.images[0] : item.image} alt={item.name} style={{ width: '50px' }} />
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center" style={{ width: '100px' }}>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm" 
                                                    onClick={() => updateQuantity(index, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </Button>
                                                <span className="mx-auto">{item.quantity}</span>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm" 
                                                    onClick={() => updateQuantity(index, item.quantity + 1)}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </td>
                                        <td>{((item.variants ? item.variants[0].price : item.price) * item.quantity).toLocaleString()} VNĐ</td>
                                        <td>
                                            <Button variant="danger" onClick={() => removeFromCart(index)}>Xóa</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">Giỏ hàng trống</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Col>
                <Col xs={12} md={4}>
                    <div className="cart__summary">
                        <h4 className="cart__summary-title">THÔNG TIN ĐƠN HÀNG</h4>
                        <div className="cart__summary-details">
                            <h3 className="cart__summary-total">
                                Tổng đơn hàng: {cart.reduce((sum, item) => sum + (item.variants ? item.variants[0].price : item.price) * item.quantity, 0).toLocaleString()} VNĐ
                            </h3>
                        </div>
                        <Button className="cart__checkout-button" onClick={() => navigate('/checkout')}>
                            THANH TOÁN
                        </Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}
