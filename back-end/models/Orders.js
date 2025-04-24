const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);