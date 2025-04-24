const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema);