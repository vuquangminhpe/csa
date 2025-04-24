const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    required: true,
    enum: ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery']
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);