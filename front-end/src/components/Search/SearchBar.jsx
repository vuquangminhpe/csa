import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const searchRef = useRef(null);

  // Đóng search khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lấy trending products khi component mount
  useEffect(() => {
    fetchTrendingProducts();
    fetchSuggestedProducts();
  }, []);

  // Search khi người dùng nhập
  useEffect(() => {
    if (searchTerm) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchTrendingProducts = async () => {
    try {
      const response = await fetch('http://localhost:9999/api/products/trending');
      const data = await response.json();
      setTrendingProducts(data.products);
    } catch (error) {
      console.error('Error fetching trending products:', error);
    }
  };

  const fetchSuggestedProducts = async () => {
    try {
      const response = await fetch('http://localhost:9999/api/products/suggested');
      const data = await response.json();
      setSuggestedProducts(data.products);
    } catch (error) {
      console.error('Error fetching suggested products:', error);
    }
  };

  const searchProducts = async () => {
    try {
      const response = await fetch(`http://localhost:9999/api/products/search?term=${searchTerm}`);
      const data = await response.json();
      setSearchResults(data.products);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleProductClick = async (productId) => {
    try {
      // Tăng lượt click cho sản phẩm
      await fetch(`http://localhost:9999/api/products/click/${productId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error updating click count:', error);
    }
  };

  return (
    <div className="search_container" ref={searchRef}>
      <div className="search_bar_c" onClick={handleSearchClick}>
        <input
          type="text"
          placeholder="Bạn cần tìm gì?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search_input_c"
        />
        <i className="fas fa-search search_icon_c"></i>
      </div>

      {isSearchOpen && (
        <div className="search_dropdown_c">
          {searchTerm ? (
            // Hiển thị kết quả tìm kiếm
            <div className="search_results_c">
              <h3>Kết quả tìm kiếm</h3>
              {searchResults.map(product => (
                <Link
                  to={`/product/${product._id}`}
                  key={product._id}
                  className="search_item_c"
                  onClick={() => handleProductClick(product._id)}
                >
                  <img src={product.images[0]} alt={product.name} className="search_product_image_c" />
                  <div className="search_product_info_c">
                    <span className="search_product_name_c">{product.name}</span>
                    <span className="search_product_price_c">
                      {product.variants[0].price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Hiển thị trending và suggested
            <>
              <div className="trending_section_c">
                <h3>Xu hướng tìm kiếm 🔥</h3>
                {trendingProducts.map(product => (
                  <Link
                    to={`/product/${product._id}`}
                    key={product._id}
                    className="trending_item_c"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <img src={product.images[0]} alt={product.name} />
                    <span>{product.name}</span>
                  </Link>
                ))}
              </div>
              <div className="suggested_section_c">
                <h3>Sản phẩm gợi ý</h3>
                {suggestedProducts.map(product => (
                  <Link
                    to={`/product/${product._id}`}
                    key={product._id}
                    className="suggested_item_c"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <img src={product.images[0]} alt={product.name} />
                    <div className="suggested_info_c">
                      <span className="suggested_name_c">{product.name}</span>
                      <span className="suggested_price_c">
                        {product.variants[0].price.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 