import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Modal from "react-modal";
import { Tabs, Form, InputNumber } from 'antd';
import CategoryManager from "./CategoryManager";
import "./MangerProduct.css";

Modal.setAppElement("#root");

const { TabPane } = Tabs;

const ManageProduct = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(5);
  const [totalProducts, setTotalProducts] = useState(0);

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  // Khởi tạo state với đầy đủ các trường của product
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    description: "",
    brand: "",
    colors: [],
    images: [],
    variants: [{ price: "", stock: "" }],
  });
  // Ảnh chính (File hoặc URL nếu đang sửa)
  const [mainImage, setMainImage] = useState(null);
  // Ảnh bổ sung (File hoặc URL từ server)
  const [additionalImages, setAdditionalImages] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);

  // Ref cho input file ẩn dùng để thêm ảnh bổ sung
  const additionalImageInputRef = useRef(null);

  // Thêm state để lưu category được chọn
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Thêm hàm handleVariantChange
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...newProduct.variants];
    newVariants[index][field] = value;
    setNewProduct(prev => ({
      ...prev,
      variants: newVariants
    }));
  };

  // Thêm hàm removeVariantField
  const removeVariantField = (index) => {
    if (newProduct.variants.length <= 1) return; // Không cho phép xóa nếu chỉ còn 1 variant
    const newVariants = [...newProduct.variants];
    newVariants.splice(index, 1);
    setNewProduct(prev => ({
      ...prev,
      variants: newVariants
    }));
  };

  // Wrap fetchProducts trong useCallback
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:9999/api/products?page=${currentPage}&limit=${productsPerPage}`);
      console.log("Products response:", response.data);
      
      if (response.data.success) {
        setProducts(response.data.products);
        setTotalProducts(response.data.totalProducts);
      } else {
        console.error("Error fetching products:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, productsPerPage]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  // Lấy danh mục (bao gồm sub_categories)
  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
    }
  };

  // Validate dữ liệu sản phẩm
  const validateProduct = () => {
    const { name, category_id, description, brand, colors, variants } = newProduct;
    
    if (!name || !category_id || !description || !brand || !colors.length || (!mainImage && !editingProduct)) {
        alert("Vui lòng điền đầy đủ thông tin và thêm ảnh chính.");
        return false;
    }

    // Kiểm tra màu sắc
    if (!colors.length) {
        alert("Vui lòng nhập ít nhất một màu sắc cho sản phẩm.");
        return false;
    }

    // Kiểm tra variants
    if (!variants.length) {
        alert("Vui lòng thêm ít nhất một variant.");
        return false;
    }

    // Kiểm tra các trường trong variants
    const isVariantsValid = variants.every(variant => {
        // Kiểm tra các trường bắt buộc của variant
        const hasRequiredFields = variant.price && variant.stock;
        
        // Kiểm tra các attributes của category, ngoại trừ color
        const hasAllAttributes = selectedCategory.attributes
            .filter(attr => attr.key !== 'color') // Loại bỏ color khỏi việc kiểm tra
            .every(attr => variant[attr.key] && variant[attr.key] !== '');

        return hasRequiredFields && hasAllAttributes;
    });

    if (!isVariantsValid) {
        alert("Vui lòng điền đầy đủ thông tin cho tất cả các variants.");
        return false;
    }

    return true;
  };

  // Thêm hoặc cập nhật sản phẩm
  const handleSaveProduct = async (values) => {
    if (!validateProduct()) return;

    try {
        const formData = new FormData();
        
        // Thêm các trường thông tin cơ bản
        formData.append("name", newProduct.name);
        formData.append("category_id", newProduct.category_id);
        formData.append("description", newProduct.description);
        formData.append("brand", newProduct.brand);
        formData.append("colors", JSON.stringify(newProduct.colors));

        // Log để debug
        console.log("Colors being sent:", newProduct.colors);
        console.log("FormData entries:");
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
        // Xử lý variants
        const variantsToSend = newProduct.variants.map(variant => {
            const cleanVariant = {};
            Object.keys(variant).forEach(key => {
                if (variant[key] !== '') {
                    cleanVariant[key] = key === 'price' || key === 'stock' 
                        ? Number(variant[key]) 
                        : variant[key];
                }
            });
            return cleanVariant;
        });

        formData.append("variants", JSON.stringify(variantsToSend));

        // Thêm ảnh chính nếu có thay đổi
        if (mainImage instanceof File) {
            formData.append("mainImage", mainImage);
        }

        // Thêm ảnh phụ nếu có thay đổi
        additionalImages.forEach(image => {
            if (image instanceof File) {
                formData.append("additionalImages", image);
            }
        });

        let response;
        if (editingProduct) {
            // Nếu đang edit thì gọi API update
            response = await axios.put(
                `http://localhost:9999/api/products/${editingProduct._id}`,
                formData,
                {
                    headers: { 
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            alert("✅ Cập nhật sản phẩm thành công!");
        } else {
            // Log request data before sending
            console.log("Sending request to create product with data:", {
                name: newProduct.name,
                category_id: newProduct.category_id,
                description: newProduct.description,
                brand: newProduct.brand,
                colors: newProduct.colors,
                variants: variantsToSend
            });

            // Nếu thêm mới thì gọi API create
            response = await axios.post(
                "http://localhost:9999/api/products",
                formData,
                {
                    headers: { 
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            alert("✅ Thêm sản phẩm thành công!");
        }

        console.log("Response:", response.data);
        fetchProducts(); // Refresh danh sách sản phẩm
        closeModal();
    } catch (error) {
        console.error("Lỗi khi lưu sản phẩm:", error);
        console.error("Error response:", error.response?.data);
        // Log the full error object
        console.log("Full error object:", error);
        alert("❌ Lỗi khi " + (editingProduct ? "cập nhật" : "thêm") + " sản phẩm: " 
            + (error.response?.data?.message || error.message));
    }
  };

  // Xóa sản phẩm
  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?");
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:9999/api/products/${productId}`);
        fetchProducts();
        alert("🗑️ Xóa sản phẩm thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        alert("❌ Đã xảy ra lỗi khi xóa sản phẩm.");
      }
    }
  };

  // Chỉnh sửa sản phẩm
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    // Tìm category của sản phẩm
    const category = categories.find(cat => cat._id === product.category_id);
    setSelectedCategory(category);
    
    // Chuyển đổi color thành mảng colors nếu cần
    let productColors = [];
    if (product.colors && Array.isArray(product.colors)) {
        productColors = product.colors;
    } else if (product.color) {
        if (Array.isArray(product.color)) {
            productColors = product.color;
        } else if (typeof product.color === 'string') {
            try {
                // Thử parse nếu là JSON string
                const parsed = JSON.parse(product.color);
                productColors = Array.isArray(parsed) ? parsed : [product.color];
            } catch (e) {
                productColors = [product.color]; // Nếu không parse được thì coi như là một giá trị đơn
            }
        }
    }
    
    setNewProduct({
        name: product.name,
        category_id: product.category_id,
        description: product.description,
        brand: product.brand,
        colors: productColors,
        variants: product.variants || [{ price: "", stock: "" }],
    });

    // Set ảnh và preview
    if (product.images && product.images.length > 0) {
        setMainImage(product.images[0]);
        setImagePreview(product.images[0]); // Thêm dòng này để hiển thị preview ảnh chính
        
        // Set ảnh phụ và preview
        const additionalImgs = product.images.slice(1);
        setAdditionalImages(additionalImgs);
        setAdditionalImagePreviews(additionalImgs); // Thêm dòng này để hiển thị preview ảnh phụ
    } else {
        setMainImage(null);
        setImagePreview(null);
        setAdditionalImages([]);
        setAdditionalImagePreviews([]);
    }
    
    setModalIsOpen(true);
  };

  // Mở form thêm sản phẩm
  const handleAddProduct = () => {
    setEditingProduct(null);
    setNewProduct({
      name: "",
      category_id: "",
      description: "",
      brand: "",
      colors: [],
      images: [],
      variants: [{ price: "", stock: "" }],
    });
    setMainImage(null);
    setAdditionalImages([]);
    setModalIsOpen(true);
  };

  // Đóng modal và reset state
  const closeModal = () => {
    setModalIsOpen(false);
    setEditingProduct(null);
    setSelectedCategory(null);
    setNewProduct({
        name: "",
        category_id: "",
        description: "",
        brand: "",
        colors: [],
        variants: [{ price: "", stock: "" }],
    });
    setMainImage(null);
    setAdditionalImages([]);
    setImagePreview(null);
    setAdditionalImagePreviews([]);
  };

  // Xử lý thêm ảnh bổ sung
  const handleAddAdditionalImage = () => {
    if (additionalImageInputRef.current) {
      additionalImageInputRef.current.click();
    }
  };

  const handleRemoveAdditionalImage = (index) => {
    const newAdditional = [...additionalImages];
    newAdditional.splice(index, 1);
    setAdditionalImages(newAdditional);
  };

  // Gọi fetchProducts khi currentPage thay đổi
  useEffect(() => {
    fetchProducts();
  }, [currentPage, fetchProducts]);

  // Hàm xử lý chuyển trang
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Component phân trang
  const Pagination = () => {
    return (
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded ${
            currentPage === 1 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Trước
        </button>
        
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === index + 1
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {index + 1}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded ${
            currentPage === totalPages
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Sau
        </button>
      </div>
    );
  };

  // Sửa lại hàm xử lý khi chọn category
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const category = categories.find(cat => cat._id === categoryId);
    
    setNewProduct(prev => ({
        ...prev,
        category_id: categoryId,
        brand: "", // Reset brand khi đổi category
        variants: [createInitialVariant(category)] // Tạo variant mới dựa trên category
    }));
    setSelectedCategory(category);
  };

  // Thêm hàm để tạo variant mới dựa trên category
  const createInitialVariant = (category) => {
    if (!category) return { price: "", stock: "" };
    
    const variant = { price: "", stock: "" };
    category.attributes.forEach(attr => {
        variant[attr.key] = "";
    });
    return variant;
  };

  // Thêm hàm xử lý thêm variant
  const handleAddVariant = () => {
    if (!selectedCategory) return;
    
    setNewProduct(prev => ({
        ...prev,
        variants: [...prev.variants, createInitialVariant(selectedCategory)]
    }));
  };

  // Sửa lại phần render variants trong modal
  const renderVariantFields = (variant, index) => {
    if (!selectedCategory) return null;

    return (
        <div className="variant-container">
            <div className="variant-grid">
                {/* Render các trường attribute của category, ngoại trừ color */}
                {selectedCategory.attributes
                    .filter(attr => attr.key !== 'color') // Loại bỏ color khỏi việc render
                    .map((attr) => (
                    <Form.Item
                        key={attr._id}
                        label={getAttributeLabel(attr.key)}
                        required
                    >
                        <select
                            value={variant[attr.key] || ""}
                            onChange={(e) => handleVariantChange(index, attr.key, e.target.value)}
                            className="form-select"
                        >
                            <option value="">Chọn {getAttributeLabel(attr.key)}</option>
                            {attr.values.map((value, i) => (
                                <option key={i} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </Form.Item>
                ))}

                {/* Các trường còn lại của variant */}
                <Form.Item
                    label="Giá"
                    required
                >
                    <InputNumber
                        value={variant.price}
                        onChange={(value) => handleVariantChange(index, "price", value)}
                        min={0}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                </Form.Item>

                <Form.Item
                    label="Số lượng"
                    required
                >
                    <InputNumber
                        value={variant.stock}
                        onChange={(value) => handleVariantChange(index, "stock", value)}
                        min={0}
                        precision={0}
                    />
                </Form.Item>
            </div>

            {newProduct.variants.length > 1 && (
                <button
                    type="button"
                    onClick={() => removeVariantField(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 flex items-center justify-center w-6 h-6"
                >
                    ×
                </button>
            )}
        </div>
    );
  };

  // Hàm chuyển đổi key thành label tiếng Việt
  const getAttributeLabel = (key) => {
    const labels = {
        'storage': 'Dung lượng',
        'screen_size': 'Kích thước màn hình',
        'battery': 'Pin',
        'battery_life': 'Thời lượng pin',
        'type': 'Loại',
        'material': 'Chất liệu',
        'length': 'Độ dài',
        'connectivity': 'Kết nối',
        'waterproof': 'Chống nước'
    };
    return labels[key] || key;
  };

  // Thêm hàm validate ảnh
  const validateImage = (file) => {
    // Kiểm tra định dạng file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('❌ Chỉ chấp nhận file ảnh định dạng JPG hoặc PNG');
      return false;
    }

    // Kiểm tra kích thước file (giới hạn 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('❌ Kích thước ảnh không được vượt quá 5MB');
      return false;
    }

    return true;
  };

  // Cập nhật hàm xử lý ảnh chính
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!validateImage(file)) {
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setMainImage(file);
    }
  };

  // Cập nhật hàm xử lý ảnh phụ
  const handleAdditionalImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => validateImage(file));
    
    if (validFiles.length !== files.length) {
      e.target.value = '';
      return;
    }

    const newPreviews = [];
    const newImages = [];

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === validFiles.length) {
          setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
      newImages.push(file);
    });

    setAdditionalImages(prev => [...prev, ...newImages]);
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultActiveKey="1">
        <TabPane tab="Quản lý sản phẩm" key="1">
          <h2 className="text-2xl font-bold mb-4">Danh sách sản phẩm</h2>
          <button className="add-product-button" onClick={handleAddProduct}>
            ➕ Thêm sản phẩm
          </button>
          <table>
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Mô tả</th>
                <th>Thương hiệu</th>
                <th>Chỉnh sửa</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(products) || products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Không có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const category = categories.find(
                    (cat) => cat._id === product.category_id
                  );
                  const brandName =
                    category?.sub_categories?.find(
                      (sub) => sub._id === product.brand
                    )?.name || "Không xác định";
                  return (
                    <tr key={product._id}>
                      <td>{product.name || "Không có tên"}</td>
                      <td>{category?.name || "Không xác định"}</td>
                      <td>{product.description || "Không có mô tả"}</td>
                      <td>{brandName}</td>
                      <td>
                        <button
                          className="bg-yellow-500"
                          onClick={() => handleEditProduct(product)}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          className="bg-red-500 ml-2"
                          onClick={() => handleDeleteProduct(product._id)}
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="product-modal" overlayClassName="product-overlay">
            <h2>{editingProduct ? "✏️ Sửa sản phẩm" : "➕ Thêm sản phẩm mới"}</h2>
            <Form
              form={form}
              onFinish={handleSaveProduct}
              layout="vertical"
            >
              <label>
                Tên sản phẩm *
                <input
                  type="text"
                  placeholder="Tên sản phẩm"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Danh mục *
                <select
                  value={newProduct.category_id}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Mô tả *
                <textarea
                  placeholder="Mô tả"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  required
                />
              </label>
              <label>
                Thương hiệu *
                <select
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  disabled={!newProduct.category_id}
                  required
                >
                  <option value="">
                    {!newProduct.category_id ? "Chọn danh mục trước" : "Chọn thương hiệu"}
                  </option>
                  {newProduct.category_id &&
                    categories.find((cat) => cat._id === newProduct.category_id)?.sub_categories.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Màu sắc *
                <div className="color-inputs">
                  {newProduct.colors.map((color, index) => (
                    <div key={index} className="color-input-group">
                      <input
                        type="text"
                        placeholder="Nhập màu sắc"
                        value={color}
                        onChange={(e) => {
                          const updatedColors = [...newProduct.colors];
                          updatedColors[index] = e.target.value.trim();
                          setNewProduct(prev => ({
                            ...prev,
                            colors: updatedColors
                          }));
                        }}
                        required
                      />
                      {newProduct.colors.length > 1 && (
                        <button
                          type="button"
                          className="remove-color-btn"
                          onClick={() => {
                            const updatedColors = newProduct.colors.filter((_, i) => i !== index);
                            setNewProduct(prev => ({
                              ...prev,
                              colors: updatedColors
                            }));
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-color-button"
                    onClick={() => {
                      setNewProduct(prev => ({
                        ...prev,
                        colors: [...prev.colors, ""]
                      }));
                    }}
                  >
                    + Thêm màu mới
                  </button>
                </div>
              </label>
              <div className="form-group">
                <label>Ảnh chính:</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="mainImageInput"
                />
                <button
                  type="button"
                  className="upload-button"
                  onClick={() => document.getElementById('mainImageInput').click()}
                >
                  {editingProduct && imagePreview ? '🔄 Thay đổi ảnh chính' : '📷 Chọn ảnh chính'}
                </button>
                {imagePreview && (
                  <div className="image-preview-item">
                    <img 
                      src={typeof imagePreview === 'string' ? imagePreview : URL.createObjectURL(mainImage)} 
                      alt="Preview" 
                      className="product-image-preview" 
                    />
                    {editingProduct && imagePreview && (
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => {
                          setImagePreview(null);
                          setMainImage(null);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Ảnh phụ:</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={handleAdditionalImageChange}
                  style={{ display: 'none' }}
                  id="additionalImagesInput"
                />
                <button
                  type="button"
                  className="upload-button"
                  onClick={() => document.getElementById('additionalImagesInput').click()}
                >
                  📷 {editingProduct ? 'Thêm ảnh phụ' : 'Chọn ảnh phụ'}
                </button>
                <div className="image-preview-container">
                  {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img 
                        src={typeof preview === 'string' ? preview : URL.createObjectURL(additionalImages[index])} 
                        alt={`Additional ${index + 1}`} 
                        className="product-image-preview"
                      />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => handleRemoveAdditionalImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Variants section */}
              {selectedCategory && (
                  <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold">Variants - {selectedCategory.name}</h3>
                          <button
                              className="add-variant-button bg-cyan-400 hover:bg-cyan-300 text-white font-semibold py-2 px-4 rounded-lg shadow-lg"
                              onClick={handleAddVariant}
                          >
                              Thêm biến thể
                          </button>
                      </div>
                      
                      {newProduct.variants.map((variant, index) => (
                          <div key={index} className="relative border rounded-lg p-4 mb-4 bg-gray-50">
                              {renderVariantFields(variant, index)}
                          </div>
                      ))}
                  </div>
              )}
              <div className="button-group mt-4">
                <button type="button" onClick={closeModal} className="cancel-button">
                  ❌ Hủy
                </button>
                <button type="submit" className="submit-button">
                  {editingProduct ? "Cập nhật" : "💾 Lưu"}
                </button>
              </div>
            </Form>
          </Modal>
          {!loading && products.length > 0 && <Pagination />}
          <div className="text-center mt-2 text-gray-600">
            Trang {currentPage} / {totalPages} (Tổng số sản phẩm: {totalProducts})
          </div>
        </TabPane>
        <TabPane tab="Quản lý danh mục" key="2">
          <CategoryManager />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ManageProduct;
