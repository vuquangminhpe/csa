const User = require("../models/User");
const Role = require("../models/Role"); 
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('786381256762-26ds2r2qbeus4ekb31nmsf3ji52hosj2.apps.googleusercontent.com');

// Đăng ký
exports.register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    // const existingPhone = await User.findOne({ phone });
    // if (existingPhone) {
    //   return res.status(400).json({ message: "Số điện thoại đã được sử dụng" });
    // }

    const userRole = await Role.findOne({ role: "customer" });
    if (!userRole) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    // Tạo token xác minh email
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Tạo người dùng mới
    const newUser = new User({
      name,
      email,
      phone,
      password,
      role: userRole._id,
      verificationToken,  
      isVerified: false,  
    });

    await newUser.save();

    // Link xác nhận email
    const verifyUrl = `http://localhost:3000/verify-email/${verificationToken}`;

    // Cấu hình transporter gửi email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL, // Email của bạn
        pass: process.env.EMAIL_PASSWORD, // Mật khẩu ứng dụng (App password)
      },
    });

    // Nội dung email
    const mailOptions = {
      from: `"GearUp Support" <${process.env.EMAIL}>`,
      to: email,
      subject: "Xác nhận đăng ký tài khoản",
      html: `<p>Xin chào <b>${name}</b>,</p>
             <p>Cảm ơn bạn đã đăng ký tài khoản.</p>
             <p>Vui lòng nhấn vào liên kết sau để xác nhận email của bạn:</p>
             <a href="${verifyUrl}"><b>Xác nhận email</b></a>
             <p>Trân trọng,</p>
             <p>Đội ngũ hỗ trợ</p>`,
    };

    // Gửi email
    try {
      await transporter.sendMail(mailOptions);
      console.log("Email xác nhận đã gửi thành công tới:", email);
      res.status(201).json({ message: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản." });
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      res.status(500).json({ message: "Đăng ký thành công nhưng không thể gửi email xác nhận." });
    }
  } catch (err) {
    console.error("Lỗi khi đăng ký:", err);
    res.status(500).json({ error: "Đã xảy ra lỗi, vui lòng thử lại." });
  }
};

// Xác minh email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    user.isVerified = true;
    user.verificationToken = undefined; // Xóa token sau khi xác minh
    await user.save();

    res.json({ message: "Xác minh email thành công, bạn có thể đăng nhập" });
  } catch (error) {
    console.error("Lỗi xác minh email:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại" });
  }
};

// Đăng nhập
exports.login = [
  // Validate email và mật khẩu
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password").isLength({ min: 6 }).withMessage("Mật khẩu phải có ít nhất 6 ký tự"),

  async (req, res) => {
    // Kiểm tra lỗi validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Sử dụng populate("role") để lấy thông tin vai trò đầy đủ
      const user = await User.findOne({ email }).populate("role");

      if (!user) {
        return res.status(404).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
      }

      if (!user.isVerified) {
        return res.status(403).json({ message: "Tài khoản của bạn chưa được xác minh. Vui lòng xác minh email của bạn trước khi đăng nhập." });
      }

      if (user.password !== password) {
        return res.status(400).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
      }
      if (user.isBanned) {
        return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ." });
      }
      // Tạo JWT token nếu đăng nhập thành công
      const token = jwt.sign(
        { _id: user._id.toString(), email: user.email, role: user.role.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      
      console.log("🔑 JWT_SECRET khi tạo token:", process.env.JWT_SECRET);
      console.log("✅ Token mới tạo:", token);
      
      res.status(200).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          image: user.image || "https://example.com/default-avatar.png",
          isVerified: user.isVerified 
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
];

// Lấy danh sách người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy thông tin người dùng theo ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thay đổi mật khẩu
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Kiểm tra mật khẩu cũ (so sánh trực tiếp vì không dùng bcrypt)
    if (user.password !== oldPassword) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    }

    // Kiểm tra mật khẩu mới có hợp lệ không
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Cập nhật mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Đăng xuất
exports.logout = async (req, res) => {
  try {
    // Kiểm tra token hết hạn
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(200).json({ message: "Logged out successfully" });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Token không hợp lệ hoặc hết hạn
      return res.status(401).json({ message: "Token expired or invalid" });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Gửi yêu cầu quên mật khẩu
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
  
    if (!user) {
      return res.status(200).json({
        message: "Nếu email hợp lệ, chúng tôi sẽ gửi một liên kết đặt lại mật khẩu.",
      });
    }
  
    // Tạo token đặt lại mật khẩu
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();
  
    // Link đặt lại mật khẩu
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const message = `Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng truy cập link sau để đặt lại mật khẩu: \n\n ${resetUrl}`;
  
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  
    await transporter.sendMail({
      from: `"GearUp Support" <${process.env.EMAIL}>`,
      to: user.email,
      subject: "Password Reset Request",
      text: message,
    });
  
    res.status(200).json({
      message: "Nếu email hợp lệ, chúng tôi đã gửi một liên kết đặt lại mật khẩu.",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Đã xảy ra lỗi. Vui lòng thử lại sau." });
  }
};
  
// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });
  
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });
  
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
  
    res.status(200).json({ message: "Mật khẩu đã được đặt lại thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy thông tin người dùng khi đã đăng nhập (profile)
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cập nhật thông tin người dùng
exports.updateUserProfile = async (req, res) => {
  const { name, address, image, phone } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Validate tên
  if (name) {
    if (name.trim() === '') {
      return res.status(400).json({ 
        message: "Tên không được để trống" 
      });
    }

    // Kiểm tra tên chỉ chứa chữ cái và khoảng trắng
    const nameRegex = /^[A-Za-zÀ-ỹ\s]+$/;
    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({ 
        message: "Tên chỉ được chứa chữ cái và khoảng trắng" 
      });
    }
  }

  // Validate số điện thoại: bắt đầu bằng 0 và có đủ 10 chữ số
  if (phone) {
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        message: "Số điện thoại không hợp lệ. Phải bắt đầu bằng số 0 và có 10 số" 
      });
    }
  }

  if (name) user.name = name.trim(); // Loại bỏ khoảng trắng thừa
  if (address) user.address = address;
  if (image) user.image = image;
  if (phone) user.phone = phone;

  await user.save();
  res.json({ 
    message: "Cập nhật thông tin thành công", 
    user 
  });
};

exports.blockUser = async (req, res) => {
  const { userId } = req.params;
  // Từ frontend vẫn gửi isBlocked, backend chuyển đổi thành isBanned
  const { isBlocked } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    user.isBanned = isBlocked;
    await user.save();
    res.status(200).json({ message: `User đã được ${isBlocked ? 'block' : 'unblock'} thành công` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật role cho user
exports.updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { newRole } = req.body;

  try {
    const role = await Role.findOne({ role: newRole });
    if (!role) return res.status(400).json({ message: "Role không hợp lệ" });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: role._id },
      { new: true }  // Lấy về document sau khi update
    ).populate("role");

    if (!updatedUser) return res.status(404).json({ message: "User không tồn tại" });

    res.status(200).json({ message: "Role của user đã được cập nhật", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: '786381256762-26ds2r2qbeus4ekb31nmsf3ji52hosj2.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Tìm user theo email
    let user = await User.findOne({ email }).populate("role");
    
    if (!user) {
      // Nếu user chưa tồn tại, tạo user mới
      const userRole = await Role.findOne({ role: "customer" });
      if (!userRole) {
        return res.status(400).json({ message: "Role không hợp lệ" });
      }

      // Tạo mật khẩu ngẫu nhiên cho tài khoản Google
      const randomPassword = crypto.randomBytes(16).toString('hex');

      // Tạo user mới với thông tin từ Google
      user = new User({
        name,
        email,
        googleId,
        password: randomPassword, // Thêm mật khẩu ngẫu nhiên
        role: userRole._id,
        isVerified: true,
        image: picture || "https://example.com/default-avatar.png",
        loginType: 'google' // Thêm trường để đánh dấu đây là tài khoản Google
      });

      await user.save();
      // Populate role sau khi save
      user = await User.findById(user._id).populate("role");
    }

    // Tạo JWT token
    const token = jwt.sign(
      { _id: user._id.toString(), email: user.email, role: user.role.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Trả về response
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        image: user.image,
        isVerified: user.isVerified
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Đăng nhập Google thất bại. Vui lòng thử lại." });
  }
};