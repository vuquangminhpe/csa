import React from "react";
import { Card, Table, Badge } from "react-bootstrap";

const OrderHistoryTable = ({ filteredOrders, handleViewProductDetail }) => {
  return (
    <Card>
      <Card.Body>
        <Table responsive striped hover>
          <thead>
            <tr>
              <th>Mã đơn hàng</th>
              <th>Ngày đặt</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Tổng tiền</th>
              <th>Sản phẩm</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order._id}>
                <td>{order.order_code}</td>
                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                <td>
                  <Badge bg={
                    order.status === "Đã hoàn thành" ? "success" :
                    order.status === "Đã hủy" ? "danger" :
                    "primary"
                  }>
                    {order.status}
                  </Badge>
                </td>
                <td>{order.paymentStatus}</td>
                <td>{order.final_price.toLocaleString()} VNĐ</td>
                <td>
                  <div className="order-history-page__order-items">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div 
                        key={idx} 
                        className="order-history-page__order-item" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProductDetail(item);
                        }}
                      >
                        <div className="order-history-page__order-item-container">
                          <div className="order-history-page__order-item-image-wrapper">
                            <img 
                              src={item.image || "https://via.placeholder.com/30"} 
                              alt={item.name} 
                              className="order-history-page__order-item-image"
                            />
                          </div>
                          <div className="order-history-page__order-item-details">
                            <p className="order-history-page__order-item-name">{item.name}</p>
                            <div className="order-history-page__order-item-info">
                              <span className="order-history-page__order-item-quantity">SL: {item.quantity || 1}</span>
                              <span className="order-history-page__order-item-price">{item.price?.toLocaleString() || 'N/A'} VNĐ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="order-history-page__order-item-more">
                        <span>+{order.items.length - 2} sản phẩm khác</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default OrderHistoryTable;