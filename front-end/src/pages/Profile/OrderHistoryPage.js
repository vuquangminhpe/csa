import { useState, useEffect } from "react";
import { Container, Alert, Spinner, Tabs, Tab } from "react-bootstrap";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import "./OrderHistoryPage.css";

// Import các component con
import OrderHistoryOverview from "../../components/Profile/OrderHistoryOverview";
import OrderHistoryTimeline from "../../components/Profile/OrderHistoryTimeline";
import OrderHistoryTable from "../../components/Profile/OrderHistoryTable";
import ProductDetailModal from "../../components/Profile/ProductDetailModal";

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [stats, setStats] = useState({
    totalSpent: 0,
    orderCount: 0,
    averageOrderValue: 0,
    mostPurchasedItems: []
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [chartOptions, setChartOptions] = useState({});

  const token = localStorage.getItem("authToken");
  const userInfo = JSON.parse(localStorage.getItem("user"));
  const customerId = userInfo?._id;

  // Fetch đơn hàng từ API
  useEffect(() => {
    if (!token || !customerId) {
      setError("Bạn cần đăng nhập để xem lịch sử đơn hàng.");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:9999/api/orders/customer/${customerId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Token không hợp lệ hoặc đã hết hạn.");
        }
        return res.json();
      })
      .then((data) => {
        // Sắp xếp đơn hàng theo ngày mới nhất
        const sortedOrders = (data.orders || []).sort((a, b) => 
          new Date(b.order_date) - new Date(a.order_date)
        );
        setOrders(sortedOrders);
        calculateStats(sortedOrders);
        
        // Chuẩn bị dữ liệu biểu đồ
        const { labels, datasets } = prepareChartData(sortedOrders);
        setChartData({ labels, datasets });
        setChartOptions({
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Chi tiêu theo tháng',
            },
          },
        });
        
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Không thể tải lịch sử đơn hàng!");
        setLoading(false);
      });
  }, []);

  // Tính toán thống kê từ đơn hàng
  const calculateStats = (orderData) => {
    // Chỉ tính các đơn hàng đã hoàn thành
    const completedOrders = orderData.filter(order => 
      order.status === "Đã hoàn thành" || order.status === "Đã giao"
    );
    
    const totalSpent = completedOrders.reduce((sum, order) => sum + order.final_price, 0);
    const orderCount = completedOrders.length;
    
    // Tính các sản phẩm mua nhiều nhất
    const itemCounts = {};
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.productId || item._id;
        if (!itemCounts[itemId]) {
          itemCounts[itemId] = {
            id: itemId,
            name: item.name,
            image: item.image,
            count: 0,
            totalQuantity: 0
          };
        }
        itemCounts[itemId].count += 1;
        itemCounts[itemId].totalQuantity += item.quantity;
      });
    });
    
    // Chuyển đổi thành mảng và sắp xếp
    const mostPurchasedItems = Object.values(itemCounts)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5); // Lấy 5 sản phẩm mua nhiều nhất
    
    setStats({
      totalSpent,
      orderCount,
      averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
      mostPurchasedItems
    });
  };

  // Lọc đơn hàng theo khoảng thời gian
  const filterOrdersByDate = () => {
    if (!dateRange.start && !dateRange.end) return orders;
    
    return orders.filter(order => {
      const orderDate = new Date(order.order_date);
      
      // Đảm bảo orderDate là một đối tượng Date hợp lệ
      if (isNaN(orderDate.getTime())) {
        console.error("Invalid order date:", order.order_date);
        return false;
      }
      
      // Xử lý ngày bắt đầu
      let startDate = null;
      if (dateRange.start) {
        startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian đầu ngày
        
        if (isNaN(startDate.getTime())) {
          console.error("Invalid start date:", dateRange.start);
          startDate = null;
        }
      }
      
      // Xử lý ngày kết thúc
      let endDate = null;
      if (dateRange.end) {
        endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian cuối ngày
        
        if (isNaN(endDate.getTime())) {
          console.error("Invalid end date:", dateRange.end);
          endDate = null;
        }
      }
      
      // Kiểm tra điều kiện lọc
      const afterStartDate = !startDate || orderDate >= startDate;
      const beforeEndDate = !endDate || orderDate <= endDate;
      
      return afterStartDate && beforeEndDate;
    });
  };

  // Chuẩn bị dữ liệu cho biểu đồ
  const prepareChartData = (ordersToChart = orders) => {
    // Nhóm đơn hàng theo tháng
    const monthlyData = {};
    
    ordersToChart.forEach(order => {
      const date = new Date(order.order_date);
      const month = date.getMonth() + 1; // Tháng (1-12)
      const year = date.getFullYear(); // Năm
      
      // Tạo key theo định dạng "MM-YYYY"
      const monthYearKey = `${month}-${year}`;
      
      if (!monthlyData[monthYearKey]) {
        monthlyData[monthYearKey] = {
          totalAmount: 0,
          count: 0,
          month,
          year
        };
      }
      
      monthlyData[monthYearKey].totalAmount += order.final_price;
      monthlyData[monthYearKey].count += 1;
    });
    
    // Sắp xếp các tháng theo thứ tự thời gian
    const sortedKeys = Object.keys(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.split('-').map(Number);
      const [monthB, yearB] = b.split('-').map(Number);
      
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });
    
    // Tạo nhãn hiển thị theo định dạng "Tháng M, YYYY"
    const labels = sortedKeys.map(key => {
      const { month, year } = monthlyData[key];
      return `Tháng ${month}, ${year}`;
    });
    
    // Dữ liệu cho biểu đồ
    const totalAmountData = sortedKeys.map(key => monthlyData[key].totalAmount);
    const orderCountData = sortedKeys.map(key => monthlyData[key].count);
    
    return {
      labels,
      datasets: [
        {
          label: 'Tổng chi tiêu (VNĐ)',
          data: totalAmountData,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          yAxisID: 'y',
        },
        {
          label: 'Số đơn hàng',
          data: orderCountData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          yAxisID: 'y1',
        },
      ],
    };
  };

  // Nhóm đơn hàng theo năm và tháng
  const groupOrdersByYearAndMonth = (ordersToGroup) => {
    const groupedOrders = {};
    
    ordersToGroup.forEach(order => {
      const date = new Date(order.order_date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      if (!groupedOrders[year]) {
        groupedOrders[year] = {};
      }
      
      if (!groupedOrders[year][month]) {
        groupedOrders[year][month] = [];
      }
      
      groupedOrders[year][month].push(order);
    });
    
    return groupedOrders;
  };

  // Xử lý xem chi tiết sản phẩm
  const handleViewProductDetail = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
    
    // Giả lập tìm kiếm sản phẩm tương tự
    setLoadingSimilar(true);
    setTimeout(() => {
      // Đây chỉ là dữ liệu mẫu, trong thực tế bạn sẽ gọi API để lấy sản phẩm tương tự
      setSimilarProducts([
        {
          id: "product1",
          name: "Sản phẩm tương tự 1",
          image: "https://via.placeholder.com/50",
          price: 299000,
          brand: "Thương hiệu A"
        },
        {
          id: "product2",
          name: "Sản phẩm tương tự 2",
          image: "https://via.placeholder.com/50",
          price: 349000,
          brand: "Thương hiệu B"
        },
        {
          id: "product3",
          name: "Sản phẩm tương tự 3",
          image: "https://via.placeholder.com/50",
          price: 399000,
          brand: "Thương hiệu C"
        }
      ]);
      setLoadingSimilar(false);
    }, 1500);
  };

  // Lọc đơn hàng theo ngày
  const filteredOrders = filterOrdersByDate();
  
  // Nhóm đơn hàng theo năm và tháng cho timeline
  const groupedOrders = groupOrdersByYearAndMonth(filteredOrders);

  // Hiển thị trạng thái loading
  if (loading) {
    return (
      <Container className="order-history-page">
        <div className="order-history-page__loading">
          <Spinner animation="border" role="status" className="order-history-page__loading-spinner">
            <span className="visually-hidden">Đang tải...</span>
          </Spinner>
          <p className="order-history-page__loading-text">Đang tải lịch sử đơn hàng...</p>
        </div>
      </Container>
    );
  }

  // Hiển thị thông báo lỗi
  if (error) {
    return (
      <Container className="order-history-page">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // Hiển thị trạng thái trống
  if (orders.length === 0) {
    return (
      <Container className="order-history-page">
        <div className="order-history-page__empty-state">
          <div className="order-history-page__empty-state-icon">📦</div>
          <h4>Bạn chưa có đơn hàng nào</h4>
          <p className="order-history-page__empty-state-text">Hãy mua sắm để xem lịch sử đơn hàng tại đây.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="order-history-page my-4">
      <h1 className="order-history-page__title text-center mb-4">Lịch Sử Đơn Hàng</h1>
      
      <Tabs defaultActiveKey="overview" id="order-history-tabs" className="mb-4">
        <Tab eventKey="overview" title="Tổng Quan">
          <OrderHistoryOverview 
            stats={stats} 
            chartData={chartData} 
            chartOptions={chartOptions} 
            handleViewProductDetail={handleViewProductDetail} 
          />
        </Tab>
        
        <Tab eventKey="timeline" title="Dòng Thời Gian">
          <OrderHistoryTimeline 
            dateRange={dateRange} 
            setDateRange={setDateRange} 
            groupedOrders={groupedOrders} 
            handleViewProductDetail={handleViewProductDetail} 
          />
        </Tab>
        
        <Tab eventKey="table" title="Bảng Đơn Hàng">
          <OrderHistoryTable 
            filteredOrders={filteredOrders} 
            handleViewProductDetail={handleViewProductDetail} 
          />
        </Tab>
      </Tabs>
      
      <ProductDetailModal 
        showProductModal={showProductModal}
        setShowProductModal={setShowProductModal}
        selectedProduct={selectedProduct}
        similarProducts={similarProducts}
        loadingSimilar={loadingSimilar}
      />
    </Container>
  );
}
  