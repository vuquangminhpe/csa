import React from "react";
import "bootstrap/dist/css/bootstrap.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import HomePage from "./pages/Home/HomePage";
import ProductDetail from "./pages/Product/Detail";
import LoginPage from "./pages/Form/LoginPage";
import RegisterPage from "./pages/Form/RegisterPage";
import CartPage from "./pages/Cart/CartPage";
import ProductListByCategory from "./pages/ProductsbyCategory/ProducsList";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/category/:categoryId" element={<ProductListByCategory />} />
      </Routes>
    </Router>
  );
};

export default App;


