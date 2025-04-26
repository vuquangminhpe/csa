import React, { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import "./style/dashboard.css";
import DashboardWrapper from "../../components/Manager/DashboardWrapper";
import NavbarDashboard from "../../components/Manager/NavbarDashboard";
import HeaderDashboardComponent from "../../components/Manager/HeaderDashboard";
import "./style.css";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    cancelled: 0,
    totalRevenue: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filteredRevenueData, setFilteredRevenueData] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Thêm useEffect để cập nhật filteredRevenueData khi revenueData thay đổi
  useEffect(() => {
    setFilteredRevenueData(revenueData);
  }, [revenueData]);

  // Hàm xử lý khi chọn tháng
  const handleMonthChange = (event) => {
    const monthValue = event.target.value;
    setSelectedMonth(monthValue);

    if (monthValue === 'all') {
      // Nếu chọn "Tất cả các tháng", hiển thị toàn bộ dữ liệu (hoặc lọc theo năm nếu đã chọn)
      const yearFiltered = revenueData.filter(data => {
        if (selectedYear === 'all') return true;
        const [, year] = data.month.split('/');
        return parseInt(year) === parseInt(selectedYear);
      });
      setFilteredRevenueData(yearFiltered);
    } else {
      // Nếu chọn một tháng cụ thể, lọc dữ liệu theo tháng và năm
      const filtered = revenueData.filter(data => {
        const [month, year] = data.month.split('/');
        return parseInt(month) === parseInt(monthValue) && 
               (selectedYear === 'all' || parseInt(year) === parseInt(selectedYear));
      });
      
      // Nếu không có dữ liệu cho tháng đã chọn, hiển thị dữ liệu trống
      if (filtered.length === 0 && selectedYear !== 'all') {
        setFilteredRevenueData([{
          month: `${monthValue}/${selectedYear}`,
          revenue: 0
        }]);
      } else {
        setFilteredRevenueData(filtered);
      }
    }
  };

  // Hàm xử lý khi chọn năm
  const handleYearChange = (event) => {
    const yearValue = event.target.value;
    setSelectedYear(yearValue);

    if (yearValue === 'all') {
      // Nếu chọn "Tất cả các năm", lọc chỉ theo tháng nếu đã chọn
      if (selectedMonth === 'all') {
        setFilteredRevenueData(revenueData);
      } else {
        const filtered = revenueData.filter(data => {
          const [month] = data.month.split('/');
          return parseInt(month) === parseInt(selectedMonth);
        });
        setFilteredRevenueData(filtered);
      }
    } else {
      // Lọc theo năm và tháng đã chọn
      const filtered = revenueData.filter(data => {
        const [month, year] = data.month.split('/');
        return (selectedMonth === 'all' || parseInt(month) === parseInt(selectedMonth)) && 
               parseInt(year) === parseInt(yearValue);
      });
      
      // Nếu không có dữ liệu và đã chọn một tháng cụ thể, hiển thị dữ liệu trống
      if (filtered.length === 0 && selectedMonth !== 'all') {
        setFilteredRevenueData([{
          month: `${selectedMonth}/${yearValue}`,
          revenue: 0
        }]);
      } else {
        setFilteredRevenueData(filtered);
      }
    }
  };

  // Lấy danh sách các năm từ dữ liệu
  const getYears = () => {
    const years = new Set();
    revenueData.forEach(data => {
      const [, year] = data.month.split('/');
      years.add(year);
    });
    return Array.from(years).sort();
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/orders");
      const allOrders = response.data.data;
      
      // Tính toán thống kê
      const completedOrders = allOrders.filter(order => 
        order.status === "Đã giao" || order.status === "Đã hoàn thành"
      );
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_price, 0);

      const stats = {
        total: allOrders.length,
        completed: completedOrders.length,
        processing: allOrders.filter(order => ["Chờ xác nhận", "Đang giao"].includes(order.status)).length,
        cancelled: allOrders.filter(order => order.status === "Đã hủy").length,
        totalRevenue: totalRevenue
      };

      // Tạo dữ liệu cho biểu đồ doanh thu
      const revenueByMonth = processRevenueData(completedOrders);
      
      // Lấy 10 đơn hàng mới nhất
      const recentOrders = allOrders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
      
      setOrders(recentOrders);
      setOrderStats(stats);
      setRevenueData(revenueByMonth);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Hàm xử lý dữ liệu doanh thu theo tháng
  const processRevenueData = (completedOrders) => {
    const monthlyRevenue = {};
    
    completedOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyRevenue[monthYear]) {
        monthlyRevenue[monthYear] = 0;
      }
      monthlyRevenue[monthYear] += order.total_price;
    });

    // Chuyển đổi thành mảng cho biểu đồ
    return Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({
        month,
        revenue
      }))
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split('/');
        const [monthB, yearB] = b.month.split('/');
        return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
      });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusClass = (status) => {
    switch(status) {
      case "Đã giao":
      case "Đã hoàn thành":
        return "status--completed";
      case "Đang giao":
        return "status--processing";
      case "Đã hủy":
        return "status--cancelled";
      default:
        return "status--pending";
    }
  };

  const orderStatusData = [
    { name: "Hoàn tất", value: orderStats.completed, color: "#34D399" },
    { name: "Đang xử lý", value: orderStats.processing, color: "#FBBF24" },
    { name: "Hủy bỏ", value: orderStats.cancelled, color: "#EF4444" },
  ];

  // Thêm custom tooltip cho biểu đồ doanh thu
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`Tháng: ${label}`}</p>
          <p className="revenue">{`Doanh thu: ${formatPrice(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardWrapper>
      <NavbarDashboard />
      <HeaderDashboardComponent>
        <div className="dashboard-container">
          {/* Tổng quan */}
          <div className="dashboard-summary">
            <DashboardCard 
              title="Tổng số đơn hàng" 
              count={orderStats.total} 
              color="summary-card summary-card--blue" 
            />
            <DashboardCard 
              title="Đơn hàng hoàn tất" 
              count={orderStats.completed} 
              color="summary-card summary-card--green" 
            />
            <DashboardCard 
              title="Tổng doanh thu" 
              count={formatPrice(orderStats.totalRevenue)} 
              color="summary-card summary-card--orange"
            />
            <DashboardCard 
              title="Đơn hàng đã hủy" 
              count={orderStats.cancelled} 
              color="summary-card summary-card--red" 
            />
          </div>

          {/* Biểu đồ doanh thu và thống kê */}
          <div className="dashboard-content">
            <div className="revenue-chart">
              <div className="chart-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 className="chart-title">Biểu đồ doanh thu theo tháng</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Tất cả các năm</option>
                    {getYears().map(year => (
                      <option key={year} value={year}>Năm {year}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Tất cả các tháng</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>Tháng {month}</option>
                    ))}
                  </select>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month"
                    label={{ value: 'Tháng', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    tickFormatter={value => value.toLocaleString('vi-VN')}
                    width={120}
                    label={{ 
                      value: 'Doanh thu (VNĐ)', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: -20
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Doanh thu theo tháng"
                    dot={{ fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: '#1e40af', stroke: '#ffffff', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="dashboard-chart">
              <h3 className="chart-title">Thống kê trạng thái đơn hàng</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={orderStatusData} 
                    dataKey="value" 
                    outerRadius={80} 
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Danh sách đơn hàng mới */}
          <div className="dashboard-orders">
            <h3 className="orders-title">Danh sách đơn hàng mới</h3>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order._id.slice(-6)}</td>
                    <td>{order.customer_id?.name || 'Không có tên'}</td>
                    <td>{formatPrice(order.total_price)}</td>
                    <td className={`status ${getStatusClass(order.status)}`}>
                      {order.status}
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </HeaderDashboardComponent>
    </DashboardWrapper>
  );
};

// Component Card cho Tổng quan
const DashboardCard = ({ title, count, color }) => {
  return (
    <div className={color}>
      <h4>{title}</h4>
      <p className="summary-card__count">{count}</p>
    </div>
  );
};

export default Dashboard;
