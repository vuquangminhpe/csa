const Question = require("../models/Question");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification"); // ✅ Sửa lại đúng tên model

// 📌 API: Người dùng gửi câu hỏi
exports.askQuestion = async (req, res) => {
  try {
    const { productId, question } = req.body;
    const userId = req.user._id; // Lấy ID từ token

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "User ID hoặc Product ID không hợp lệ." });
    }

    const newQuestion = new Question({
      user: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(productId),
      question,
    });

    await newQuestion.save();
    res.status(201).json({ message: "Câu hỏi đã được gửi và đang chờ duyệt.", question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi gửi câu hỏi.", error: error.message });
  }
};

// 📌 API: Lấy danh sách câu hỏi của sản phẩm
exports.getQuestionsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('Getting questions for productId:', productId);
    
    // Lọc ra những câu hỏi đã duyệt (approved) và còn hiển thị (isVisible)
    const populatedQuestions = await Question.find({ 
      product: productId,
      isVisible: true,
      status: "approved"
    })
      .populate("user", "name email")
      .populate("answers.sale", "name email")
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian mới nhất
    
    console.log('Questions after population:', {
      total: populatedQuestions.length,
      statuses: populatedQuestions.map(q => q.status),
      isVisible: populatedQuestions.map(q => q.isVisible)
    });

    res.status(200).json({ questions: populatedQuestions });
  } catch (error) {
    console.error("Error in getQuestionsByProduct:", error);
    res.status(500).json({ message: "Lỗi khi lấy câu hỏi.", error: error.message });
  }
};


// 📌 API: Sale trả lời câu hỏi
exports.answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer, saleId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return res.status(400).json({ message: "Sale ID không hợp lệ." });
    }

    const user = await User.findById(saleId).populate("role", "role");
    if (!user || user.role.role !== "sale") {
      return res.status(403).json({ message: "Chỉ nhân viên Sale mới có thể trả lời câu hỏi." });
    }

    const question = await Question.findById(questionId).populate("product", "name");
    if (!question) {
      return res.status(404).json({ message: "Câu hỏi không tồn tại." });
    }

    if (question.status === "pending") {
      question.status = "approved";
    }

    question.answers.push({ sale: saleId, answer });
    await question.save();

    // 🔥 Tạo thông báo cho user đã hỏi câu hỏi
    const notification = new Notification({
      user: question.user,
      message: `Bộ phận QTV đã trả lời câu hỏi của bạn cho sản phẩm "${question.product.name}"`,
      link: `/product/${question.product._id}`, // Đưa link đến trang chi tiết sản phẩm
    });
    await notification.save();

    res.status(200).json({ message: "Đã trả lời câu hỏi.", question });
  } catch (error) {
    console.error("❌ Lỗi khi trả lời câu hỏi:", error);
    res.status(500).json({ message: "Lỗi khi trả lời câu hỏi.", error: error.message });
  }
};


// 📌 API: Sale từ chối câu hỏi
exports.rejectQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const saleId = req.body.saleId || req.user?.id;

    if (!saleId) {
      return res.status(400).json({ message: "Thiếu saleId." });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Câu hỏi không tồn tại." });
    }

    question.status = "rejected";
    question.rejectedBy = saleId;
    await question.save();

    // 🔥 Tạo thông báo khi câu hỏi bị từ chối
    const notification = new Notification({
      user: question.user,
      type: "comment",
      message: "Câu hỏi của bạn đã bị từ chối.",
      link: `/product/${question.product}`,
    });
    await notification.save();

    res.status(200).json({ message: "Câu hỏi đã bị từ chối.", question });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi từ chối câu hỏi.", error: error.message });
  }
};

// 📌 API: Lấy tất cả câu hỏi (Dành cho Sale)
exports.getAllQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 4, sort = "createdAt", status } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber < 1 || pageSize < 1) {
      return res.status(400).json({ message: "Giá trị page hoặc limit không hợp lệ." });
    }

    // Tạo query filter dựa trên status
    const filter = status ? { status } : {};

    const questions = await Question.find(filter)
      .sort({ createdAt: sort === "desc" ? -1 : 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate("user", "name email")
      .populate("product", "name images")
      .populate("answers.sale", "name email");

    const totalQuestions = await Question.countDocuments(filter);

    res.status(200).json({
      questions,
      totalQuestions,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalQuestions / pageSize),
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách câu hỏi.", error: error.message });
  }
};

exports.removeQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Câu hỏi không tồn tại." });
    }

    question.status = "removed";
    question.isVisible = false;  // Ẩn câu hỏi khỏi khách hàng
    await question.save();

    res.status(200).json({ message: "Câu hỏi đã được gỡ bỏ.", question });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi gỡ bỏ câu hỏi.", error: error.message });
  }
};
exports.editAnswer = async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    const { answer } = req.body;
    const saleId = req.user._id;

    console.log('Edit answer request:', {
      questionId,
      answerId,
      answer,
      saleId
    });

    // Kiểm tra tính hợp lệ của ID
    if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
      console.log('Invalid ID format');
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const question = await Question.findById(questionId);
    console.log('Found question:', question ? 'yes' : 'no');
    
    if (!question) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi." });
    }

    const answerToUpdate = question.answers.id(answerId);
    console.log('Found answer:', answerToUpdate ? 'yes' : 'no');
    
    if (!answerToUpdate) {
      return res.status(404).json({ message: "Không tìm thấy câu trả lời." });
    }

    console.log('Comparing sale IDs:', {
      answerSaleId: answerToUpdate.sale.toString(),
      requestSaleId: saleId.toString()
    });

    if (answerToUpdate.sale.toString() !== saleId.toString()) {
      return res.status(403).json({ message: "Bạn không được phép chỉnh sửa câu trả lời này." });
    }

    answerToUpdate.answer = answer;
    await question.save();

    console.log('Answer updated successfully');
    res.status(200).json({ message: "Câu trả lời đã được cập nhật.", question });
  } catch (error) {
    console.error('Error in editAnswer:', error);
    res.status(500).json({ 
      message: "Lỗi khi cập nhật câu trả lời.", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
