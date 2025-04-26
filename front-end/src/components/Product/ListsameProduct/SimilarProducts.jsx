import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import "./SimilarProducts.css";

const API_BASE_URL = "http://localhost:9999/api";

const SimilarProducts = ({ productId }) => {
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const token = localStorage.getItem("authToken") || "";

  useEffect(() => {
    if (!productId) return;

    axios
      .get(`${API_BASE_URL}/products/similar/${productId}`)
      .then((res) => {
        setSimilarProducts(res.data.products.slice(0, 4));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi khi tải sản phẩm tương tự:", err);
        setLoading(false);
      });
  }, [productId]);

  useEffect(() => {
    if (token) {
      fetchFavorites();
    }
  }, [token]);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(response.data.favorites.map((fav) => fav._id));
    } catch (err) {
      console.error("Lỗi khi tải danh sách yêu thích:", err);
    }
  };

  const toggleFavorite = async (productId, productName) => {
    if (!token) {
      window.alert("Vui lòng đăng nhập để thêm vào danh sách yêu thích!");
      return;
    }

    const isFavorited = favorites.includes(productId);
    try {
      if (isFavorited) {
        await axios.post(
          `${API_BASE_URL}/favorites/remove`,
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites(favorites.filter((id) => id !== productId));
      } else {
        await axios.post(
          `${API_BASE_URL}/favorites/add`,
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites([...favorites, productId]);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật yêu thích:", error);
    }
  };

  const getLowestPrice = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return Math.min(...variants.map((v) => v.price));
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="similar-products-container-sp">
      <h2 className="similar-products-title-sp">Sản phẩm tương tự</h2>
      <div className="similar-products-list-sp">
        {similarProducts.map((product) => (
          <div key={product._id} className="product-card-sp">
            <div className="product-image-wrapper-sp">
  <Link 
    to={`/product/${product._id}`} 
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
  >  
    <img
      src={product.images[0] || '/default-product.png'}
      alt={product.name}
      className="product-image-sp"
    />
  </Link>
  <button
    className={`favorite-button ${favorites.includes(product._id) ? "favorited" : ""}`}
    onClick={() => toggleFavorite(product._id, product.name)}
  >
    <FaHeart size={20} />
  </button>
</div>

            <div className="product-info-sp">
              <h3>{product.name}</h3>
              <p><strong>Thương hiệu:</strong> {product.brand?.name || "Không có"}</p>
              <p><strong>Màu sắc:</strong> {product.colors.join(", ") || "Không có"}</p>
              <p><strong>Giá từ:</strong> {getLowestPrice(product.variants).toLocaleString()} VNĐ</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarProducts;
