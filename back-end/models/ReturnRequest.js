const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Requested', 'Approved', 'Rejected', 'Completed'],
    default: 'Requested'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);