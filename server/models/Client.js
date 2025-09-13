const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    unique: true,
    required: true,
    default: 'IM001' // ডিফল্ট ভ্যালু
  },
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
  baseRate: {
    type: Number,
    default: 0
  },
  extraRatePerKg: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    default: 0
  },
  clientType: {
    type: String,
    enum: ['VIP', 'NEW', 'REGULAR'],
    default: 'REGULAR'
  },
  rateConfigurations: [{
    shipperAddressPattern: String,
    weight: Number,
    rate: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ইউনিক ইনডেক্স যোগ করুন যাতে একই নাম এবং ঠিকানা সহ ক্লায়েন্ট না তৈরি হয়
clientSchema.index({ name: 1, address: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 } // Case-insensitive comparison
});

// Update the updatedAt field before saving
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Client', clientSchema);