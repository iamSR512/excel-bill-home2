const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratePerKg: {
    type: Number,
    default: 0
  },
  usdSurcharge: {
    type: Number,
    default: 0
  },
  // নতুন rateConfigurations ফিল্ড যোগ করা হয়েছে
  rateConfigurations: [{
    shipperAddressPattern: String,
    weight: Number,
    rate: Number
  }]
});

module.exports = mongoose.model('Client', clientSchema);