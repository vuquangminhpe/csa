const axios = require("axios");

const checkToxicity = async (req, res, next) => {
  const { comment } = req.body;
  
  if (!comment) return next(); // Nếu không có comment thì bỏ qua middleware này

  try {
    const response = await axios.post(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=YOUR_API_KEY`,
      {
        comment: { text: comment },
        languages: ["vi"], 
        requestedAttributes: { TOXICITY: {} }
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const toxicityScore = response.data.attributeScores.TOXICITY.summaryScore.value;

    if (toxicityScore >= 0.7) { // Ngưỡng để phát hiện toxic (có thể điều chỉnh)
      return res.status(400).json({ message: "Nội dung đánh giá của bạn không phù hợp. Vui lòng viết lại một cách lịch sự." });
    }

    next(); // Nếu không có vấn đề thì cho phép tiếp tục
  } catch (error) {
    console.error("Lỗi khi kiểm tra toxicity:", error);
    res.status(500).json({ message: "Lỗi khi kiểm tra độ phù hợp của nội dung." });
  }
};

module.exports = checkToxicity;
