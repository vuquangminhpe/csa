const express = require("express");
const { getGeminiResponse } = require("../controllers/geminiController");

const router = express.Router();

// This route will be accessible at /api/gemini/chatbot
router.post("/chatbot", getGeminiResponse);

module.exports = router;
