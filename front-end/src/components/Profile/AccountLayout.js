import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "../Common/Header"; 
import Footer from "../Common/Footer";

export default function AccountLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header nằm trên cùng */}
      <Header />

      {/* Nội dung chính chiếm hết phần còn lại của màn hình */}
      <div className="container flex-grow-1 mt-4">
        <div className="row">
          {/* Sidebar chiếm 3 cột */}
          <div className="col-md-3">
            <Sidebar />
          </div>

          {/* Nội dung chiếm 9 cột */}
          <div className="col-md-9">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Footer nằm dưới cùng */}
      <Footer className="mt-auto" />
    </div>
  );
}
