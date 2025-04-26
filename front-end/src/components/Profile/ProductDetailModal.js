import React, { useState, useEffect } from "react";
import { Modal, Button, Card, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";

const API_BASE_URL = "http://localhost:9999/api";

const ProductDetailModal = ({ 
  showProductModal, 
  setShowProductModal, 
  selectedProduct, 
  similarProducts, 
  loadingSimilar 
}) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(response.data);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };

    if (showProductModal && selectedProduct) {
      fetchCategories();
    }
  }, [showProductModal, selectedProduct]);

  const getBrandName = (brandId) => {
    for (const category of categories) {
      const subCategory = category.sub_categories.find(sub => sub._id === brandId);
      if (subCategory) return subCategory.name;
    }
    return "Không xác định";
  };

  return (
    <Modal 
      show={showProductModal} 
      onHide={() => setShowProductModal(false)}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết sản phẩm</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedProduct && (
          <Card className="border-0">
            <Card.Body>
              <Row className="align-items-center mb-4">
                <Col md={4}>
                  <img 
                    src={selectedProduct.image || "https://via.placeholder.com/300"} 
                    alt={selectedProduct.name} 
                    className="order-history-page__product-detail-image"
                  />
                </Col>
                <Col md={8}>
                  <h4 className="order-history-page__product-detail-title">{selectedProduct.name}</h4>
                  {selectedProduct.brand && (
                    <p className="order-history-page__product-detail-attribute"><strong>Thương hiệu:</strong> {getBrandName(selectedProduct.brand)}</p>
                  )}
                  {selectedProduct.price && (
                    <h5 className="order-history-page__product-detail-price">{selectedProduct.price.toLocaleString()} VNĐ</h5>
                  )}
                  
                  {selectedProduct.color && (
                    <p className="order-history-page__product-detail-attribute"><strong>Màu sắc:</strong> {selectedProduct.color}</p>
                  )}
                  
                  {selectedProduct.variant && (
                    <p className="order-history-page__product-detail-attribute">
                      <strong>Biến thể:</strong> {
                        selectedProduct.variant.storage || 
                        selectedProduct.variant.material || 
                        selectedProduct.variant.length || 
                        "Không có"
                      }
                    </p>
                  )}
                  
                  <p className="order-history-page__product-detail-attribute"><strong>Số lượng:</strong> {selectedProduct.totalQuantity || selectedProduct.quantity || 1}</p>
                  
                  {/* Thông tin thêm về sản phẩm */}
                  <div className="order-history-page__product-detail-additional mt-3">
                    <h6 className="mb-2">Thông tin bổ sung</h6>
                    <Row>
                      <Col md={6}>
                        <ul className="order-history-page__product-detail-features">
                          <li>Bảo hành: 12 tháng chính hãng</li>
                          <li>Giao hàng: Miễn phí toàn quốc</li>
                          <li>Đổi trả: Trong vòng 7 ngày</li>
                        </ul>
                      </Col>
                      <Col md={6}>
                        <div className="order-history-page__product-detail-rating">
                          <p><strong>Đánh giá:</strong> <span className="text-warning">★★★★☆</span> (4/5)</p>
                          <p><strong>Lượt mua:</strong> {selectedProduct.totalQuantity || selectedProduct.quantity || 1} sản phẩm</p>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
              
              
       
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowProductModal(false)}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductDetailModal;