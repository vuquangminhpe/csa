const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// Route đăng nhập
router.post('/login', login);

module.exports = router; 