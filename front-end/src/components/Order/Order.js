import { useState, useEffect } from "react";
import { Container, Row, Col, Table, Button, Alert, Card, Image, Modal, Badge, Nav } from "react-bootstrap";
import "./Order.css"; // Import CSS để làm đẹp giao diện

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null); // State để lưu đơn hàng được chọn
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // Thêm state cho modal chi tiết
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("all"); // State để theo dõi tab đang active

  const token = localStorage.getItem("authToken");
  const userInfo = JSON.parse(localStorage.getItem("user"));
  const customerId = userInfo?._id;

  // 🔹 Hàm fetch đơn hàng từ API
  const fetchOrders = () => {
    if (!token || !customerId) {
      setError("Bạn cần đăng nhập để xem đơn hàng.");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:9999/api/orders/customer/${customerId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Token không hợp lệ hoặc đã hết hạn.");
        }
        return res.json();
      })
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Không thể tải đơn hàng!");
        setLoading(false);
      });
  };

  // 🔹 Gọi API khi component được mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Hàm xác nhận đơn hàng thành công
  const handleConfirmSuccess = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:9999/api/orders/${currentOrderId}/confirm-success`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setActionMessage({ type: "success", text: "Xác nhận đơn hàng thành công" });
        
        // Cập nhật trạng thái đơn hàng trong state mà không cần gọi lại API
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === currentOrderId 
              ? { ...order, status: "Đã hoàn thành" } 
              : order
          )
        );
        
        // Nếu đơn hàng đang được chọn là đơn hàng vừa cập nhật, cập nhật selectedOrder
        if (selectedOrder && selectedOrder._id === currentOrderId) {
          setSelectedOrder(prev => ({ ...prev, status: "Đã hoàn thành" }));
        }
        
        setTimeout(() => {
          setShowConfirmModal(false);
          setActionMessage({ type: "", text: "" });
        }, 2000);
      } else {
        setActionMessage({ type: "danger", text: data.message || "Có lỗi xảy ra khi xác nhận" });
      }
    } catch (error) {
      setActionMessage({ type: "danger", text: "Lỗi kết nối, vui lòng thử lại sau" });
    } finally {
      setActionLoading(false);
    }
  };

  // Hàm xử lý yêu cầu trả hàng/hoàn tiền
  const handleReturnRequest = async () => {
    if (!returnReason.trim()) {
      setActionMessage({ type: "danger", text: "Vui lòng nhập lý do trả hàng" });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:9999/api/orders/${currentOrderId}/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: returnReason })
      });

      const data = await response.json();
      
      if (response.ok) {
        setActionMessage({ type: "success", text: "Yêu cầu trả hàng đã được gửi thành công" });
        
        // Cập nhật trạng thái đơn hàng trong state mà không cần gọi lại API
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === currentOrderId 
              ? { 
                  ...order, 
                  returnRequest: {
                    reason: returnReason,
                    status: "Đang xử lý",
                    requestDate: new Date()
                  }
                } 
              : order
          )
        );
        
        // Nếu đơn hàng đang được chọn là đơn hàng vừa cập nhật, cập nhật selectedOrder
        if (selectedOrder && selectedOrder._id === currentOrderId) {
          setSelectedOrder(prev => ({ 
            ...prev, 
            returnRequest: {
              reason: returnReason,
              status: "Đang xử lý",
              requestDate: new Date()
            }
          }));
        }
        
        setTimeout(() => {
          setShowReturnModal(false);
          setReturnReason("");
          setActionMessage({ type: "", text: "" });
        }, 2000);
      } else {
        setActionMessage({ type: "danger", text: data.message || "Có lỗi xảy ra khi gửi yêu cầu" });
      }
    } catch (error) {
      setActionMessage({ type: "danger", text: "Lỗi kết nối, vui lòng thử lại sau" });
    } finally {
      setActionLoading(false);
    }
  };

  // Hàm mở modal chi tiết đơn hàng
  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Hàm lọc đơn hàng theo trạng thái
  const getFilteredOrders = () => {
    if (activeTab === "all") {
      return orders;
    }
    
    const statusMap = {
      "pending": "Chờ thanh toán",
      "processing": "Đang xử lý",
      "confirmed": "Đã xác nhận",
      "shipping": "Đang giao",
      "delivered": "Đã giao",
      "completed": "Đã hoàn thành",
      "cancelled": "Đã hủy",
      "return": "Trả hàng/Hoàn tiền"
    };
    
    // Lọc đơn hàng theo trạng thái
    return orders.filter(order => {
      if (activeTab === "return" && order.returnRequest) {
        return true;
      }
      return order.status === statusMap[activeTab];
    });
  };

  // Đếm số lượng đơn hàng theo trạng thái
  const countOrdersByStatus = (status) => {
    if (status === "all") {
      return orders.length;
    }
    
    const statusMap = {
      "pending": "Chờ thanh toán",
      "processing": "Đang xử lý",
      "confirmed": "Đã xác nhận",
      "shipping": "Đang giao",
      "delivered": "Đã giao",
      "completed": "Đã hoàn thành",
      "cancelled": "Đã hủy",
      "return": "Trả hàng/Hoàn tiền"
    };
    
    if (status === "return") {
      return orders.filter(order => order.returnRequest).length;
    }
    
    return orders.filter(order => order.status === statusMap[status]).length;
  };

  // Thêm hàm xử lý thanh toán lại
  const handlePaymentRedirect = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:9999/api/payment/payment-link/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.paymentUrl) {
        // Chuyển hướng người dùng đến trang thanh toán
        window.location.href = data.paymentUrl;
      } else {
        setError(data.message || "Không thể lấy link thanh toán");
      }
    } catch (error) {
      console.error("Lỗi khi lấy link thanh toán:", error);
      setError("Lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.");
    }
  };

  // 🔹 Hiển thị loading trong khi chờ dữ liệu
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
        <h3>Đang tải đơn hàng...</h3>
      </Container>
    );
  }

  // 🔹 Hiển thị lỗi nếu có
  if (error) {
    return (
      <Container className="text-center p-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // Lấy danh sách đơn hàng đã lọc
  const filteredOrders = getFilteredOrders();

  // 🔹 Hiển thị đơn hàng nếu có dữ liệu
  return (
    <Container style={{ minHeight: "40vh" }}>
      <h1 className="text-center">Đơn Hàng Của Bạn</h1>
      
      {/* Thanh điều hướng trạng thái đơn hàng dạng table */}
      <div className="order-status-table-container my-4">
        <table className="order-status-table">
          <tbody>
            <tr>
              <td 
                className={`status-cell ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                <div className="status-content">
                  <span>Tất cả</span>
                  <Badge bg="secondary" className="mt-1">{countOrdersByStatus("all")}</Badge>
                </div>
              </td>
              <td 
                className={`status-cell ${activeTab === "processing" ? "active" : ""}`}
                onClick={() => setActiveTab("processing")}
              >
                <div className="status-content">
                  <span>Đang xử lý</span>
                  <Badge bg="secondary" className="mt-1">{countOrdersByStatus("processing")}</Badge>
                </div>
              </td>
              <td 
                className={`status-cell ${activeTab === "confirmed" ? "active" : ""}`}
                onClick={() => setActiveTab("confirmed")}
              >
                <div className="status-content">
                  <span>Đã xác nhận</span>
                  <Badge bg="secondary" className="mt-1">{countOrdersByStatus("confirmed")}</Badge>
                </div>
              </td>
              <td 
                className={`status-cell ${activeTab === "shipping" ? "active" : ""}`}
                onClick={() => setActiveTab("shipping")}
              >
                <div className="status-content">
                  <span>Đang giao</span>
                  <Badge bg="secondary" className="mt-1">{countOrdersByStatus("shipping")}</Badge>
                </div>
              </td>
              <td 
                className={`status-cell ${activeTab === "delivered" ? "active" : ""}`}
                onClick={() => setActiveTab("delivered")}
              >
                <div className="status-content">
                  <span>Đã giao</span>
                  <Badge bg="secondary" className="mt-1">{countOrdersByStatus("delivered")}</Badge>
                </div>
              </td>
              <td 
                className={`status-cell ${activeTab === "completed" ? "active" : ""}`}
                onClick={() => setActiveTab("completed")}
              >
                <div className="status-content">
                  <span>Đã hoàn thành</span>
                  <Badge bg="secondary" className="mt-1">{countOrdersByStatus("completed")}</Badge>
                </div>
              </td>
              <td 
                className={`status-cell ${activeTab === "cancelled" ? "active" : ""}`}
                onClick={() => setActiveTab("cancelled")}
              >
                <div className="status-content">
                  <span>Đã hủy</span>
                  <Badge bg="secondary" className="mt-1">{countOrdersByStatus("cancelled")}</Badge>
                </div>
              </td>
              <td 
                className={`status-cell ${activeTab === "return" ? "active" : ""}`}
                onClick={() => setActiveTab("return")}
              >
                <div className="status-content">
                  <span>Trả hàng/Hoàn tiền</span>
                  <Badge bg="secondary" className="mt-1">{countOrdersByStatus("return")}</Badge>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <Row className="my-3">
        {/* Danh sách đơn hàng */}
        <Col xs={12}>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Mã đơn hàng</th>
                <th>Ngày đặt</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Phương thức</th>
                <th>Tổng tiền</th>
                <th>Số sản phẩm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <tr key={order._id}>
                    <td>{order.order_code}</td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td>{order.status}</td>
                    <td>{order.paymentStatus || "Chưa xác định"}</td>
                    <td>{order.paymentMethod || "Chưa xác định"}</td>
                    <td>{order.final_price.toLocaleString()} VNĐ</td>
                    <td>{order.items.length}</td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        className="mb-1 w-100"
                        onClick={() => handleViewDetail(order)}
                      >
                        Xem chi tiết
                      </Button>
                      
                      {/* Thêm nút thanh toán cho đơn hàng chờ thanh toán và phương thức chuyển khoản */}
                      {(order.paymentStatus === "Chờ thanh toán" || order.status === "Đang xử lý") && 
                       (order.paymentMethod === "bank_transfer" || order.paymentMethod === "Chuyển khoản") && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="mb-1 w-100"
                          onClick={() => handlePaymentRedirect(order.order_code)}
                        >
                          Thanh toán ngay
                        </Button>
                      )}
                      
                      {order.status === "Đã giao" && !order.returnRequest && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            className="mb-1 w-100"
                            onClick={() => {
                              setCurrentOrderId(order._id);
                              setShowConfirmModal(true);
                            }}
                          >
                            Xác nhận thành công
                          </Button>
                          <Button
                            variant="warning"
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              setCurrentOrderId(order._id);
                              setShowReturnModal(true);
                            }}
                          >
                            Trả hàng/Hoàn tiền
                          </Button>
                        </>
                      )}
                      
                      {order.returnRequest && (
                        <Badge bg="info" className="mt-1 w-100 p-2 d-block">
                          Yêu cầu trả hàng: {order.returnRequest.status}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-orders text-center">
                    Không có đơn hàng nào trong mục này.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Col>
      </Row>

      {/* Modal chi tiết đơn hàng */}
      <Modal 
        show={showDetailModal} 
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đơn hàng {selectedOrder?.order_code}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <Card className="border-0">
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <p><strong>Mã đơn hàng:</strong> {selectedOrder.order_code}</p>
                    <p><strong>Ngày đặt:</strong> {new Date(selectedOrder.order_date).toLocaleString()}</p>
                    <p><strong>Trạng thái:</strong> {selectedOrder.status}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Thanh toán:</strong> {selectedOrder.paymentStatus || "Chưa xác định"}</p>
                    <p><strong>Phương thức:</strong> {selectedOrder.paymentMethod || "Chưa xác định"}</p>
                    <p><strong>Tổng tiền:</strong> {selectedOrder.final_price.toLocaleString()} VNĐ</p>
                  </Col>
                </Row>
                
                <h5 className="mt-4 mb-3">Sản phẩm:</h5>
                <div className="order-items">
                  {selectedOrder.items.map((item, index) => (
                    <Card key={index} className="mb-3 border">
                      <Card.Body>
                        <Row className="align-items-center">
                          <Col xs={3} md={2}>
                            <Image
                              src={item.image || "https://via.placeholder.com/150"}
                              alt={item.name}
                              fluid
                              rounded
                            />
                          </Col>
                          <Col xs={9} md={10}>
                            <Row>
                              <Col md={8}>
                                <h6>{item.name}</h6>
                                <p className="mb-1"><small>Màu sắc: {item.color}</small></p>
                                <p className="mb-1">
                                  <small>
                                    Biến thể: {item.variant?.storage || item.variant?.material || item.variant?.length || "Không có"}
                                  </small>
                                </p>
                              </Col>
                              <Col md={4} className="text-md-end">
                                <p className="mb-1"><small>Số lượng: {item.quantity}</small></p>
                                <p className="mb-0"><strong>Giá: {item.price.toLocaleString()} VNĐ</strong></p>
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
                
                {selectedOrder.status === "Đã giao" && !selectedOrder.returnRequest && (
                  <Row className="mt-4">
                    <Col md={6} className="mb-2">
                      <Button
                        variant="success"
                        className="w-100"
                        onClick={() => {
                          setCurrentOrderId(selectedOrder._id);
                          setShowConfirmModal(true);
                          setShowDetailModal(false);
                        }}
                      >
                        Xác nhận thành công
                      </Button>
                    </Col>
                    <Col md={6}>
                      <Button
                        variant="warning"
                        className="w-100"
                        onClick={() => {
                          setCurrentOrderId(selectedOrder._id);
                          setShowReturnModal(true);
                          setShowDetailModal(false);
                        }}
                      >
                        Trả hàng/Hoàn tiền
                      </Button>
                    </Col>
                  </Row>
                )}
                
                {selectedOrder.returnRequest && (
                  <Alert variant="info" className="mt-3">
                    <strong>Trạng thái yêu cầu trả hàng:</strong> {selectedOrder.returnRequest.status}<br/>
                    <strong>Lý do:</strong> {selectedOrder.returnRequest.reason}<br/>
                    <strong>Ngày yêu cầu:</strong> {new Date(selectedOrder.returnRequest.requestDate).toLocaleString()}
                  </Alert>
                )}

                {/* Tương tự, thêm nút thanh toán trong modal chi tiết đơn hàng */}
                {selectedOrder && selectedOrder.paymentStatus === "Chờ thanh toán" && selectedOrder.paymentMethod === "bank_transfer" && (
                  <Row className="mt-4">
                    <Col>
                      <Button
                        variant="primary"
                        className="w-100"
                        onClick={() => handlePaymentRedirect(selectedOrder.order_code)}
                      >
                        Thanh toán ngay
                      </Button>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal xác nhận trả hàng/hoàn tiền */}
      <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yêu cầu trả hàng/hoàn tiền</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionMessage.text && (
            <Alert variant={actionMessage.type}>{actionMessage.text}</Alert>
          )}
          <div className="form-group">
            <label htmlFor="returnReason">Lý do trả hàng:</label>
            <textarea
              className="form-control"
              id="returnReason"
              rows="3"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Vui lòng nhập lý do trả hàng..."
            ></textarea>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReturnModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleReturnRequest}
            disabled={actionLoading}
          >
            {actionLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal xác nhận đơn hàng thành công */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận đơn hàng thành công</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionMessage.text && (
            <Alert variant={actionMessage.type}>{actionMessage.text}</Alert>
          )}
          <p>Bạn xác nhận đã nhận được hàng và hài lòng với đơn hàng này?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="success" 
            onClick={handleConfirmSuccess}
            disabled={actionLoading}
          >
            {actionLoading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
