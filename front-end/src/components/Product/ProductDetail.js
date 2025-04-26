import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Button, Alert, Badge } from "react-bootstrap";
import "./ProductDetail.css";

const API_BASE_URL = "http://localhost:9999/api";

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [mainImage, setMainImage] = useState("");
    const [message, setMessage] = useState("");
    const token = localStorage.getItem("authToken");
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/products/${id}`);
                console.log("Dữ liệu sản phẩm:", response.data);
                setProduct(response.data);
                setSelectedVariant(response.data.variants[0]);
                setMainImage(response.data.images[0]);
                
                // Xử lý màu sắc từ cả hai trường hợp color và colors
                if (response.data.colors && response.data.colors.length > 0) {
                    // Trường hợp sản phẩm có trường colors (array)
                    setSelectedColor(response.data.colors[0]);
                } else if (response.data.color) {
                    // Trường hợp sản phẩm có trường color (string hoặc array)
                    if (Array.isArray(response.data.color)) {
                        setSelectedColor(response.data.color[0]);
                    } else {
                        setSelectedColor(response.data.color);
                    }
                }
            } catch (err) {
                setError("Không tìm thấy sản phẩm!");
            } finally {
                setLoading(false);
            }
        };
        const fetchAverageRating = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/reviews/${id}`);
                setAverageRating(response.data.averageRating || 0);
                setTotalReviews(response.data.totalReviews || 0);
            } catch (err) {
                console.error("Lỗi khi tải điểm đánh giá:", err);
            }
        };
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/categories`);
                setCategories(response.data);
            } catch (err) {
                console.error("Lỗi khi tải danh mục:", err);
            }
        };

        Promise.all([fetchProduct(), fetchCategories(), fetchAverageRating()]);
    }, [id]);

    const getBrandName = (brandId) => {
        for (const category of categories) {
            const subCategory = category.sub_categories.find(sub => sub._id === brandId);
            if (subCategory) return subCategory.name;
        }
        return "Không xác định";
    };

    const addToCart = async () => {
        if (!token) {
            setMessage("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng!");
            return;
        }

        try {
            const response = await axios.post(
                `${API_BASE_URL}/cart`,
                {
                    product_id: product._id,
                    quantity: 1,
                    variant_index: product.variants.indexOf(selectedVariant),
                    selected_color: selectedColor
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setMessage("Sản phẩm đã được thêm vào giỏ hàng!");
        } catch (error) {
            setMessage(error.response?.data?.message || "Có lỗi xảy ra khi thêm vào giỏ hàng!");
        }
    };

    const getColors = () => {
        if (product.colors && product.colors.length > 0) {
            return product.colors;
        } else if (product.color) {
            return Array.isArray(product.color) ? product.color : [product.color];
        }
        return [];
    };

    if (loading) return <div className="text-center p-5">Đang tải sản phẩm...</div>;
    if (error) return <div className="text-center p-5 text-danger">{error}</div>;
    if (!product) return <div className="text-center p-5">Không tìm thấy sản phẩm</div>;

    return (
        <Container className="product-detail py-5">
            <Row>
                <Col md={6}>
                    <div className="product-detail__image-container">
                        <img
                            src={mainImage}
                            alt={product.name}
                            className="product-detail__main-image"
                        />
                    </div>
                    <div className="product-detail__thumbnails">
                        {product.images.map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                alt={`${product.name} - ${index}`}
                                className={`product-detail__thumbnail ${mainImage === img ? "product-detail__thumbnail--active" : ""}`}
                                onClick={() => setMainImage(img)}
                            />
                        ))}
                    </div>
                </Col>

                <Col md={6}>
                    <Card className="product-detail__info p-4 shadow">
                        <Card.Body>
                            <Card.Title className="product-detail__title">{product.name}
                                <span className="product-detail__rating">
                                    <span className="stars">
                                        {"★".repeat(Math.round(averageRating))}
                                        {"☆".repeat(5 - Math.round(averageRating))}
                                    </span>
                                    <span className="review-count"> {totalReviews} đánh giá</span>
                                </span>
                            </Card.Title>
                            <p className="product-detail__brand"><strong>Thương hiệu:</strong> {getBrandName(product.brand)}</p>
                            
                            {/* Hiển thị màu sắc để chọn - xử lý cả hai trường hợp color và colors */}
                            {getColors().length > 0 && (
                                <div className="product-detail__colors mt-3">
                                    <h6>Màu sắc:</h6>
                                    <div className="d-flex flex-wrap">
                                        {getColors().map((color, index) => (
                                            <Button 
                                                key={index}
                                                variant={selectedColor === color ? "danger" : "outline-secondary"}
                                                className="me-2 mb-2 product-detail__color-btn"
                                                onClick={() => setSelectedColor(color)}
                                            >
                                                {color}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {message && <Alert variant="success">{message}</Alert>}

                            {Object.keys(product.variants[0]).map((key) => {
                                if (key !== "stock" && key !== "price" && key !== "_id") {
                                    return (
                                        <div key={key}>
                                            <h6 className="mt-3">Chọn {key}:</h6>
                                            <div className={`product-detail__${key}-options d-flex flex-wrap`}>
                                                {Array.from(new Set(product.variants.map(v => v[key]))).map((value, index) => {
                                                    // Tìm biến thể có giá trị này
                                                    const variant = product.variants.find(v => v[key] === value);
                                                    const inStock = variant && variant.stock > 0;
                                                    
                                                    return (
                                                        <Button
                                                            key={index}
                                                            variant={selectedVariant && selectedVariant[key] === value ? "danger" : "outline-secondary"}
                                                            className={`product-detail__${key}-btn me-2 mb-2`}
                                                            onClick={() => setSelectedVariant(variant)}
                                                            disabled={!inStock}
                                                        >
                                                            {value}
                                                            {variant && (
                                                                <Badge 
                                                                    bg={inStock ? "success" : "danger"} 
                                                                    className="ms-2"
                                                                >
                                                                    {inStock ? `Còn ${variant.stock}` : "Hết hàng"}
                                                                </Badge>
                                                            )}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}

                            <h4 className="product-detail__price text-danger mt-3">
                                {new Intl.NumberFormat().format(selectedVariant.price)} đ
                            </h4>

                            <Button
                                variant="danger"
                                className="product-detail__add-to-cart w-100 mt-3"
                                disabled={!selectedVariant.stock}
                                onClick={addToCart}
                            >
                                {selectedVariant.stock > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProductDetail;
