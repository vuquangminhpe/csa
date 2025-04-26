import React from "react";
import { Container, Row, Col, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import logo2 from "../../assets/GearUp_logo2.png";
import "./Footer.css"; // Import CSS

const Footer = () => {
  return (
    <footer className="footer ">
      <Container>
        <Row>
          <Col md={4} className="text-center text-md-start">
            <img src={logo2} alt="XGEAR logo" className="mb-2" />
            <p>GEARUP - Chuyên cung cấp đồ công nghệ cao cấp chính hãng.</p>
            <p><i className="fas fa-phone"></i> 02871081881</p>
            <p><i className="fas fa-envelope"></i> sales@gearup.com</p>
          </Col>

          <Col md={4}>
            <h5>CHÍNH SÁCH</h5>
            <ListGroup variant="flush">
              <ListGroup.Item><Link to="/search">Tìm kiếm</Link></ListGroup.Item>
              <ListGroup.Item><Link to="/contact">Liên hệ</Link></ListGroup.Item>
              <ListGroup.Item><Link to="/warranty">Trung tâm bảo hành</Link></ListGroup.Item>
            </ListGroup>
          </Col>

          <Col md={4}>
            <h5>HƯỚNG DẪN</h5>
            <ListGroup variant="flush">
              <ListGroup.Item><Link to="/payment-guide">Hướng dẫn thanh toán</Link></ListGroup.Item>
              <ListGroup.Item><Link to="/installment">Hướng dẫn trả góp</Link></ListGroup.Item>
              <ListGroup.Item><Link to="/warranty-check">Tra cứu bảo hành</Link></ListGroup.Item>
              <ListGroup.Item><Link to="/careers">Tuyển dụng</Link></ListGroup.Item>
              <ListGroup.Item><Link to="/news">Tin công nghệ</Link></ListGroup.Item>
              <ListGroup.Item><Link to="/warranty-policy">Chính sách bảo hành</Link></ListGroup.Item>
              <ListGroup.Item><Link to="/refund-policy">Chính sách đổi mới hoàn tiền</Link></ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>

        <Row className="mt-2">
          <Col className="text-center">
            <p className="m-0">© {new Date().getFullYear()} GEARUP. All Rights Reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
