import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Search.css';

const Search = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchTerm.trim()) {
        try {
          const response = await axios.get(`http://localhost:9999/api/products/filter/search?name=${searchTerm}`);
          setSearchResults(response.data.data || []);
        } catch (error) {
          console.error('Error searching products:', error);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  return (
    <div className="search_container_c" ref={searchRef}>
      <div className="search_input_c" onClick={() => setIsOpen(true)}>
        <input
          type="text"
          placeholder="Bạn cần tìm gì?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search_input"
        />
        <i className="fas fa-search search_icon"></i>
      </div>

      {isOpen && (
        <div className="search_results_c">
          {searchResults.length > 0 ? (
            <div className="search_results_list">
              {searchResults.map((product) => (
                <Link
                  to={`/product/${product._id}`}
                  key={product._id}
                  className="search_result_item"
                  onClick={() => setIsOpen(false)}
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="search_result_image"
                  />
                  <div className="search_result_info">
                    <h4 className="search_result_name">{product.name}</h4>
                    <p className="search_result_price">
                      {formatPrice(product.variants[0].price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="search_no_results">
              Không tìm thấy sản phẩm phù hợp
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Search; 