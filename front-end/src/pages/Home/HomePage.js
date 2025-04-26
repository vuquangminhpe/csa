import React from "react";
import Header from "../../components/Common/Header"; 
import Footer from "../../components/Common/Footer"; 
import ListProduct from "../../components/Product/ListProduct";
import Banner from '../../components/Common/Banner';
import "./HomePage.css";

const HomePage = () => {
  return (
    <div>
      <Header />
      <Banner />
      
      {/* Background trắng bám sát sản phẩm */}
      <div className="homepage_content_hp">
        <div className="main_product_wrapper_hp">
          <div className="list_product_container_hp">
            <ListProduct />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
