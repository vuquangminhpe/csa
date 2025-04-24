const express = require('express');
const router = express.Router();
const { getVariantByCategory } = require('../controllers/categoryVariantController');

router.get('/category-variants/:categoryId', getVariantByCategory);

module.exports = router; 