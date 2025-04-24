const express = require("express");
const { getFavorites, addFavorite, removeFavorite ,getMostFavoriteProductsByCategory} = require("../controllers/favoriteController");
const { authMiddleware } = require("../middleware/auth"); // Kiểm tra đường dẫn

const router = express.Router();

// Sử dụng authMiddleware thay vì verifyToken
router.get("/", authMiddleware, getFavorites);
router.post("/add", authMiddleware, addFavorite);
router.post("/remove", authMiddleware, removeFavorite);
router.get("/mostfavorite/by-category", getMostFavoriteProductsByCategory);
module.exports = router;
