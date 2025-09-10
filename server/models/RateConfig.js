const mongoose = require('mongoose');

const RateConfigSchema = new mongoose.Schema({
  ratePerKg: { type: Number, required: true },
  usdSurcharge: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('RateConfig', RateConfigSchema);
