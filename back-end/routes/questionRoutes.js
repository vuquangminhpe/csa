const express = require("express");
const router = express.Router();
const { 
  askQuestion,
  getQuestionsByProduct,
  answerQuestion,
  rejectQuestion,
  getAllQuestions,
  removeQuestion,
  editAnswer
} = require("../controllers/questionController");

const { authMiddleware } = require("../middleware/auth");

router.post("/", authMiddleware, askQuestion); 
router.get("/:productId", getQuestionsByProduct);
router.put("/:questionId/answer", authMiddleware, answerQuestion); 
router.put("/:questionId/reject", authMiddleware, rejectQuestion); 
router.get("/user/all", getAllQuestions); 
router.put("/:questionId/remove", authMiddleware, removeQuestion); 
router.put("/:questionId/answer/:answerId/edit", authMiddleware, editAnswer); 

module.exports = router;
