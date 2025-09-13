const mongoose = require('mongoose');

const RateConfigSchema = new mongoose.Schema({
  ratePerKg: { type: Number, required: true },
  usdSurcharge: { type: Number, required: true },
  baseRate: { type: Number, default: 0 },
  extraRatePerKg: { type: Number, default: 0 },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('RateConfig', RateConfigSchema);