import React, { useEffect, useState, forwardRef } from "react";
import { Table, Button, Badge, Dropdown } from "react-bootstrap";
import { MoreVertical, Printer } from "lucide-react";
import axios from "axios";
import "./ManageOrder.css";

// Custom Dropdown Toggle without caret
const CustomToggle = forwardRef(({ children, onClick }, ref) => (
  <button
    className="btn btn-light order-management__action-button"
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    style={{ border: 'none', background: 'transparent' }}
  >
    {children}
  </button>
));

function ManageOrder() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setIsLoading(true);
    setError(null);
    
    axios.get("http://localhost:9999/api/orders")
      .then(response => {
        if (response.data && response.data.data) {
          setOrders(response.data.data);
        } else {
          setOrders([]);
          console.warn("Received empty or invalid data format");
        }
      })
      .catch(error => {
        console.error("Lỗi tải đơn hàng:", error);
        setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
        
        if (error.response) {
          console.error("Server error:", error.response.status, error.response.data);
        } else if (error.request) {
          console.error("No response received:", error.request);
        } else {
          console.error("Request error:", error.message);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      console.log('Sending update request:', { orderId, newStatus }); // Debug log
      
      const response = await axios.put(`http://localhost:9999/api/orders/${orderId}/status`, {
        status: newStatus
      });
      
      console.log('Update response:', response.data); // Debug log
      
      // Nếu đơn hàng được cập nhật thành "Đã giao" và phương thức thanh toán là "Tiền mặt"
      // thì cập nhật trạng thái thanh toán thành "Đã thanh toán"
      if (newStatus === "Đã giao") {
        const orderToUpdate = orders.find(order => order._id === orderId);
        if (orderToUpdate && 
            orderToUpdate.paymentMethod === "Tiền mặt" && 
            orderToUpdate.paymentStatus === "Chờ thanh toán") {
          await handleUpdatePaymentStatus(orderId, "Đã thanh toán");
        }
      }
      
      // Refresh orders list
      fetchOrders();
      alert("Cập nhật trạng thái đơn hàng thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      alert("Lỗi khi cập nhật trạng thái đơn hàng");
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      console.log('Sending payment status update request:', { orderId, newPaymentStatus }); // Debug log
      
      const response = await axios.put(`http://localhost:9999/api/orders/${orderId}/payment-status`, {
        paymentStatus: newPaymentStatus
      });
      
      console.log('Payment status update response:', response.data); // Debug log
      
      // Refresh orders list sau khi cập nhật trạng thái thanh toán
      fetchOrders();
      
      // Hiển thị thông báo thành công
      if (newPaymentStatus === "Thanh toán thất bại" && 
          orders.find(o => o._id === orderId)?.paymentMethod === "bank_transfer") {
        alert("Đã cập nhật trạng thái thanh toán thất bại và tự động hủy đơn hàng!");
      } else {
        alert("Cập nhật trạng thái thanh toán thành công!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái thanh toán:", error);
      alert("Lỗi khi cập nhật trạng thái thanh toán");
    }
  };

  const handlePrintInvoice = (order) => {
    // Tạo cửa sổ in mới
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn - ${order.order_code}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 30px;
            }
            .invoice-details {
              margin-bottom: 20px;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .invoice-table th, .invoice-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .invoice-total {
              text-align: right;
              margin-top: 20px;
            }
            .payment-info {
              margin-top: 20px;
              padding: 10px;
              background-color: #f8f9fa;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h2>HÓA ĐƠN BÁN HÀNG</h2>
            <p>Mã đơn: ${order.order_code}</p>
            <p>Ngày tạo: ${new Date(order.order_date).toLocaleDateString()}</p>
          </div>
          
          <div class="invoice-details">
            <p><strong>Khách hàng:</strong> ${order.customer_id?.name}</p>
            <p><strong>Địa chỉ:</strong> ${order.customer_id?.address}</p>
            <p><strong>Số điện thoại:</strong> ${order.customer_id?.phone}</p>
          </div>

          <table class="invoice-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product_id.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price?.toLocaleString()}đ</td>
                  <td>${(item.quantity * item.price).toLocaleString()}đ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="invoice-total">
            <p><strong>Tổng tiền:</strong> ${order.total_price.toLocaleString()}đ</p>
          </div>
          
          <div class="payment-info">
            <p><strong>Phương thức thanh toán:</strong> ${
              order.paymentMethod === "cash" ? "Tiền mặt" : 
              order.paymentMethod === "bank_transfer" ? "Chuyển khoản" : 
              order.paymentMethod || 'Không xác định'
            }</p>
            <p><strong>Trạng thái thanh toán:</strong> ${order.paymentStatus || 'Không xác định'}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Hàm kiểm tra xem đơn hàng có thể xác nhận hay không
  const canConfirmOrder = (order) => {
    // Nếu trạng thái thanh toán là "Thanh toán thất bại", không cho phép xác nhận
    return order.status === "Đang xử lý" && order.paymentStatus !== "Thanh toán thất bại";
  };

  // Hàm kiểm tra xem đơn hàng có thể cập nhật trạng thái thanh toán hay không
  const canUpdatePaymentStatus = (order) => {
    return order.paymentMethod === "Tiền mặt" && 
           order.paymentStatus === "Chờ thanh toán" && 
           order.status === "Đã giao";
  };

  return (
    <div className="order-management">
      <h1 className="order-management__title">Quản lý đơn hàng</h1>
      <Table striped bordered hover className="order-management__table">
        <thead className="order-management__thead">
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Số điện thoại</th>
            <th>Địa chỉ</th>
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Trạng thái</th>
            <th>Thanh toán</th>
            <th>Phương thức</th>
            <th>Ngày tạo</th>
            <th>Giá</th>
            <th></th>
          </tr>
        </thead>
        <tbody className="order-management__tbody">
          {orders.map(order => (
            <tr key={order._id} className="order-management__row">
              <td className="order-management__cell">{order.order_code}</td>
              <td className="order-management__cell">{order.customer_id?.name}</td>
              <td className="order-management__cell">{order.customer_id?.phone}</td>
              <td className="order-management__cell">{order.customer_id?.address}</td>
              <td className="order-management__cell">
                {order.items.map(item => (
                  <div key={item.product_id} className="order-management__product-name">
                    {item.product_id.name}
                  </div>
                ))}
              </td>
              <td className="order-management__cell">
                {order.items.map(item => (
                  <div key={item.product_id} className="order-management__product-quantity">
                    {item.quantity} x {item.variant?.storage || item.variant?.material || item.variant?.length}
                  </div>
                ))}
              </td>
              <td className="order-management__cell">
                <span className={`order-management__status-label ${order.status.replace(/\s+/g, '-').toLowerCase()}`}>
                  {order.status}
                </span>
              </td>
              <td className="order-management__cell">
                <span className={`order-management__payment-status ${
                  order.paymentStatus === "Thanh toán thất bại" ? "payment-failed" : 
                  order.paymentStatus === "Chờ thanh toán" ? "payment-pending" :
                  order.paymentStatus === "Đã thanh toán" ? "payment-success" : ""
                }`}>
                  {order.paymentStatus}
                </span>
              </td>
              <td className="order-management__cell">
                {order.paymentMethod === "cash" ? "Tiền mặt" : 
                 order.paymentMethod === "bank_transfer" ? "Chuyển khoản" : 
                 order.paymentMethod || "Không xác định"}
              </td>
              <td className="order-management__cell">{new Date(order.order_date).toLocaleDateString()}</td>
              <td className="order-management__cell order-management__price">{order.total_price.toLocaleString()} đ</td>
              <td className="order-management__cell">
                <Dropdown>
                  <Dropdown.Toggle as={CustomToggle} id={`dropdown-${order._id}`}>
                    <MoreVertical size={18} />
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {canConfirmOrder(order) && (
                      <Dropdown.Item 
                        onClick={() => handleUpdateStatus(order._id, "Đã xác nhận")}
                      >
                        Xác nhận đơn hàng
                      </Dropdown.Item>
                    )}
                    {order.paymentStatus === "Thanh toán thất bại" && order.status === "Đang xử lý" && (
                      <Dropdown.Item 
                        className="text-danger"
                        onClick={() => handleUpdateStatus(order._id, "Đã hủy")}
                      >
                        Hủy đơn hàng
                      </Dropdown.Item>
                    )}
                    {canUpdatePaymentStatus(order) && (
                      <Dropdown.Item 
                        onClick={() => handleUpdatePaymentStatus(order._id, "Đã thanh toán")}
                      >
                        Cập nhật đã thanh toán
                      </Dropdown.Item>
                    )}
                    {order.paymentMethod === "bank_transfer" && order.paymentStatus === "Chờ thanh toán" && (
                      <Dropdown.Item 
                        className="text-danger"
                        onClick={() => handleUpdatePaymentStatus(order._id, "Thanh toán thất bại")}
                      >
                        Cập nhật thanh toán thất bại
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item onClick={() => handlePrintInvoice(order)}>
                      <Printer size={16} className="me-2" />
                      In hóa đơn
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ManageOrder;