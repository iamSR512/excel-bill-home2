// server/models/Bill.js
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
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bill', billSchema);