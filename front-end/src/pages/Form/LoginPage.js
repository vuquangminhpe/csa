import React from "react";
import Login from "../../components/Form/Login"; // Import component Login
import Header from "../../components/Common/Header";
import Footer from "../../components/Common/Footer";

const LoginPage = () => {
  return (
    <div className="app-container">
      <Header />
      <div className="content">
        <Login /> 
      </div>
      <Footer /> 
    </div>
  );
};

export default LoginPage;
