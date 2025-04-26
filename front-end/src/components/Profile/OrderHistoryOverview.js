import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import { Line } from "react-chartjs-2";

const OrderHistoryOverview = ({ stats, chartData, chartOptions, handleViewProductDetail }) => {
  return (
    <>
      <Row className="mb-4">
        <Col md={4}>
          <Card className="order-history-page__stat-card">
            <Card.Body>
              <Card.Title className="order-history-page__stat-card-title">Tổng Chi Tiêu</Card.Title>
              <h3 className="order-history-page__stat-card-value">{stats.totalSpent.toLocaleString()} VNĐ</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="order-history-page__stat-card">
            <Card.Body>
              <Card.Title className="order-history-page__stat-card-title">Số Đơn Hàng</Card.Title>
              <h3 className="order-history-page__stat-card-value">{stats.orderCount}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="order-history-page__stat-card">
            <Card.Body>
              <Card.Title className="order-history-page__stat-card-title">Giá Trị Trung Bình</Card.Title>
              <h3 className="order-history-page__stat-card-value">{stats.averageOrderValue.toLocaleString()} VNĐ</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Biểu Đồ Chi Tiêu Theo Tháng</Card.Title>
          <Line data={chartData} options={chartOptions} />
        </Card.Body>
      </Card>
      
      
    </>
  );
};

export default OrderHistoryOverview;