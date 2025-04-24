const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  carrier: {
    type: String,
    required: true,
    trim: true
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Shipped', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  estimatedArrival: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Shipment', shipmentSchema);