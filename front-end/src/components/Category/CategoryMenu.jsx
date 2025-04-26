import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import axios from "axios";
import "./CategoryMenu.css";

const CategoryMenu = () => {
  const [categories, setCategories] = useState([]);
  const [show, setShow] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate(); // Sử dụng navigate thay vì Link

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/categories");
        setCategories(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };

    fetchCategories();
  }, []);
  const handleCategoryClick = (categoryId) => {
    navigate(`/products/category/${categoryId}`);
    setShow(false); 
  };

  return (
    <Dropdown show={show} onToggle={() => setShow(!show)} className="category-container">
      <Dropdown.Toggle variant="light" className="category-btn d-flex align-items-center">
        <i className="fas fa-bars me-2"></i> Danh mục
      </Dropdown.Toggle>

      <Dropdown.Menu className="category-dropdown p-2">
        {categories.map((category) => (
          <div
            key={category._id}
            className="category-item"
            onMouseEnter={() => setActiveCategory(category._id)}
            onMouseLeave={() => setActiveCategory(null)}
            onClick={() => handleCategoryClick(category._id)} 
          >
            <span className="d-flex align-items-center">
              {category.name}
              <i className="fas fa-chevron-right ms-auto"></i>
            </span>
            {activeCategory === category._id && category.sub_categories.length > 0 && (
              <div className="sub-menu">
                <h5>{category.name}</h5>
                <ul className="list-unstyled">
                  {category.sub_categories.map((sub) => (
                    <li key={sub._id} onClick={(e) => { 
                      e.stopPropagation(); 
                      navigate(`/products/category/${category._id}/sub/${sub._id}`);
                    }}>
                      {sub.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default CategoryMenu;
