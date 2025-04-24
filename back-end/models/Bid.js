const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  bidTime: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bid', BidSchema);