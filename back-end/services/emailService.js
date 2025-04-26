const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to send payment confirmation email
const sendPaymentConfirmationEmail = async (userEmail, orderDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Xác nhận thanh toán thành công",
    html: `
      <h2>Thanh toán thành công</h2>
      <p>Xin chào,</p>
      <p>Cảm ơn bạn đã mua hàng tại GearUp. Đơn hàng của bạn đã được thanh toán thành công.</p>
      <h3>Thông tin đơn hàng:</h3>
      <ul>
        <li>Mã đơn hàng: ${orderDetails.orderId}</li>
        <li>Tổng tiền: ${orderDetails.totalAmount} VNĐ</li>
        <li>Phương thức thanh toán: ${orderDetails.paymentMethod}</li>
        <li>Ngày thanh toán: ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>Chúng tôi sẽ cập nhật thông tin vận chuyển cho bạn trong thời gian sớm nhất.</p>
      <p>Trân trọng,</p>
      <p>Đội ngũ GearUp</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Payment confirmation email sent successfully");
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
    throw error;
  }
};

// Function to send order status update email
const sendOrderStatusUpdateEmail = async (userEmail, orderDetails) => {
  let statusMessage = "";
  let subject = "";

  switch (orderDetails.status) {
    case "delivered":
      statusMessage = "Đơn hàng của bạn đã được giao thành công.";
      subject = "Đơn hàng đã được giao thành công";
      break;
    case "failed":
      statusMessage = "Rất tiếc, đơn hàng của bạn giao không thành công.";
      subject = "Đơn hàng giao không thành công";
      break;
    default:
      statusMessage = `Trạng thái đơn hàng của bạn đã được cập nhật: ${orderDetails.status}`;
      subject = "Cập nhật trạng thái đơn hàng";
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: subject,
    html: `
      <h2>${subject}</h2>
      <p>Xin chào,</p>
      <p>${statusMessage}</p>
      <h3>Thông tin đơn hàng:</h3>
      <ul>
        <li>Mã đơn hàng: ${orderDetails.orderId}</li>
        <li>Trạng thái: ${orderDetails.status}</li>
        <li>Ngày cập nhật: ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
      <p>Trân trọng,</p>
      <p>Đội ngũ GearUp</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Order status update email sent successfully");
  } catch (error) {
    console.error("Error sending order status update email:", error);
    throw error;
  }
};

module.exports = {
  sendPaymentConfirmationEmail,
  sendOrderStatusUpdateEmail,
};
