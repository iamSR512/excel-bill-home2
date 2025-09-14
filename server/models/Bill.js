const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  customerNumber: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  billAmount: {
    type: Number,
    required: true
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  excelData: {
    type: Object,
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Check if model already exists before defining
module.exports = mongoose.models.Bill || mongoose.model('Bill', billSchema);