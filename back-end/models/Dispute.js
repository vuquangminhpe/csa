const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  resolution: {
    type: String,
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dispute', disputeSchema);