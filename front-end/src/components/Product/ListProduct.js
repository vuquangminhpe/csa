import React, { useState, useEffect } from "react";
import axios from "axios";
import { Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./ListProduct.css";

const API_BASE_URL = "http://localhost:5000/api";

const ListProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/products`);
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Lỗi khi tải danh sách sản phẩm!");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    // Kiểm tra nếu đã có sản phẩm này thì chỉ tăng số lượng
    const index = cart.findIndex(item => item.product_id === product._id);
    if (index > -1) {
      cart[index].quantity += 1;
    } else {
      cart.push({
        product_id: product._id,
        name: product.title || product.name,
        price: product.price,
        image: product.images && product.images[0],
        quantity: 1
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    setMessage("Đã thêm vào giỏ hàng!");
    setTimeout(() => setMessage(""), 2000);
  };

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger" className="text-center">{error}</Alert>;
  if (!products || products.length === 0) return <Alert variant="info" className="text-center">Không có sản phẩm nào</Alert>;

  return (
    <div className="list-product-container">
      <h2 className="list-product-title">Danh sách sản phẩm</h2>
      {message && <div style={{ color: 'green', marginBottom: 10 }}>{message}</div>}
      <div className="product-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-image-wrapper">
              <img
                src={product.images?.[0] || '/default-product.png'}
                alt={product.name}
                className="product-image"
                onClick={() => navigate(`/product/${product._id}`)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-product.png';
                }}
              />
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p><strong>Giá:</strong> {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(product.price)}</p>
              <button 
                className="add-to-cart-btn"
                onClick={() => addToCart(product)}
              >
                <i className="fas fa-shopping-cart"></i> Thêm vào giỏ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListProduct;
