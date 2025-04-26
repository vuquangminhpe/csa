import React from "react";
import { Card, Row, Col, Form, Button, Badge } from "react-bootstrap";

const OrderHistoryTimeline = ({ 
  dateRange, 
  setDateRange, 
  groupedOrders, 
  handleViewProductDetail 
}) => {
  return (
    <Card>
      <Card.Body>
        <Card.Title className="mb-4">Lọc Theo Thời Gian</Card.Title>
        <Row className="order-history-page__filter mb-4">
          <Col md={5}>
            <Form.Group className="order-history-page__filter-group">
              <Form.Label className="order-history-page__filter-label">Từ ngày</Form.Label>
              <Form.Control 
                type="date" 
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({...dateRange, start: e.target.value});
                }}
              />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group className="order-history-page__filter-group">
              <Form.Label className="order-history-page__filter-label">Đến ngày</Form.Label>
              <Form.Control 
                type="date" 
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({...dateRange, end: e.target.value});
                }}
              />
            </Form.Group>
          </Col>
          <Col md={2} className="order-history-page__filter-button">
            <Button 
              variant="outline-secondary" 
              className="w-100"
              onClick={() => setDateRange({ start: "", end: "" })}
            >
              Đặt lại
            </Button>
          </Col>
        </Row>
        
        <div className="order-history-page__timeline">
          {Object.keys(groupedOrders).sort((a, b) => b - a).map(year => (
            <div key={year} className="order-history-page__timeline-year">
              <h4 className="order-history-page__timeline-year-header">{year}</h4>
              {Object.keys(groupedOrders[year])
                .sort((a, b) => b - a)
                .map(month => {
                  const monthName = new Date(year, month - 1, 1).toLocaleString('vi', { month: 'long' });
                  return (
                    <div key={`${year}-${month}`} className="order-history-page__timeline-month">
                      <h5 className="order-history-page__timeline-month-header">{monthName}</h5>
                      <div className="order-history-page__timeline-orders">
                        {groupedOrders[year][month].map(order => (
                          <Card key={order._id} className="order-history-page__order-card mb-3">
                            <Card.Body>
                              <div className="order-history-page__order-card-header">
                                <h6 className="order-history-page__order-card-title">Đơn hàng #{order.order_code}</h6>
                                <Badge bg={
                                  order.status === "Đã hoàn thành" ? "success" :
                                  order.status === "Đã hủy" ? "danger" :
                                  "primary"
                                }>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="order-history-page__order-card-info">Ngày đặt: {new Date(order.order_date).toLocaleDateString()}</p>
                              <p className="order-history-page__order-card-info">Tổng tiền: {order.final_price.toLocaleString()} VNĐ</p>
                              <p className="order-history-page__order-card-info">Số sản phẩm: {order.items.length}</p>
                              <div className="order-history-page__order-card-items">
                                {order.items.slice(0, 2).map((item, idx) => (
                                  <div 
                                    key={idx} 
                                    className="order-history-page__item-preview" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewProductDetail(item);
                                    }}
                                  >
                                    <div className="order-history-page__item-preview-container">
                                      <div className="order-history-page__item-preview-image-wrapper">
                                        <img 
                                          src={item.image || "https://via.placeholder.com/30"} 
                                          alt={item.name} 
                                          className="order-history-page__item-preview-image"
                                        />
                                      </div>
                                      <div className="order-history-page__item-preview-details">
                                        <p className="order-history-page__item-preview-name">{item.name}</p>
                                        <div className="order-history-page__item-preview-info">
                                          <span className="order-history-page__item-preview-quantity">SL: {item.quantity || 1}</span>
                                          <span className="order-history-page__item-preview-price">{item.price?.toLocaleString() || 'N/A'} VNĐ</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <div className="order-history-page__item-preview order-history-page__item-preview--more">
                                    +{order.items.length - 2}
                                  </div>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default OrderHistoryTimeline;