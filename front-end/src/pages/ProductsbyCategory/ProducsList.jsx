import { useParams } from "react-router-dom";
import Header from "../../components/Common/Header";
import Banner from "../../components/Common/Banner";
import Footer from "../../components/Common/Footer";

import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import ProductListByCategorys from "../../components/ProductsbyCategory/ProductList";
import ProductFilterSort from "../../components/Filter/ProductFilterSort";
import { Container } from "../../config/baseBoostrap";
const API_BASE_URL = "http://localhost:9999/api";

const ProductListByCategory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { id: categoryId, sub: brandId } = useParams();

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
      setCategories([]);
    }
  };
  const fetchProducts = useCallback(
    async (filters = {}, sortBy = null) => {
      try {
        setLoading(true);
        let queryParams = new URLSearchParams({
          category: categoryId,
          ...(brandId && { brand: brandId }),
          ...(filters.stockStatus && { stockStatus: filters.stockStatus }),
          ...(filters.minPrice && { minPrice: filters.minPrice }),
          ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
          ...(sortBy && { sortByPrice: sortBy }),
        });
        Object.keys(filters).forEach((key) => {
          if (!["stockStatus", "minPrice", "maxPrice","price"].includes(key)) {
            queryParams.append(key, filters[key]);
          }
        });
        const endpoint = `${API_BASE_URL}/products/filter/search?${queryParams}`;
        const response = await axios.get(endpoint);

        console.log(" API Response:", response.data);
        setProducts(response.data?.data || []);
      } catch (error) {
        console.error(" Lỗi khi lấy sản phẩm:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [categoryId, brandId]
  );

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  return (
    <>
      <Header />
      <Banner />
      <Container>
        <ProductFilterSort
          onUpdateProducts={fetchProducts}
          products={products}
        />
        <ProductListByCategorys data={products} categories={categories} />
      </Container>
      <Footer />

    </>
  );
};

export default ProductListByCategory;
