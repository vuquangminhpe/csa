import React from "react";
import ForgotPassword from "../../components/Form/ForgotPassword"; // Import component Login
import Header from "../../components/Common/Header";
import Footer from "../../components/Common/Footer";

const ForgotPasswordPage = () => {
  return (
    <div className="app-container">
      <Header />
      <div className="content">
        <ForgotPassword /> 
      </div>
      <Footer /> 
    </div>
  );
};

export default ForgotPasswordPage;
