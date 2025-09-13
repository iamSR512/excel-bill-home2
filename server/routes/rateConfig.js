const express = require('express');
const router = express.Router();
const RateConfig = require('../models/RateConfig');
const Client = require('../models/Client'); // Client মডেল import করুন

// POST - Save or Update RateConfig
router.post('/', async (req, res) => {
  try {
    const { ratePerKg, usdSurcharge, baseRate, extraRatePerKg, discountType, discountValue, updateAllClients } = req.body;

    // Check if config exists
    let config = await RateConfig.findOne();
    if (config) {
      config.ratePerKg = ratePerKg;
      config.usdSurcharge = usdSurcharge;
      config.baseRate = baseRate;
      config.extraRatePerKg = extraRatePerKg;
      config.discountType = discountType;
      config.discountValue = discountValue;
      await config.save();
    } else {
      config = new RateConfig({ 
        ratePerKg, 
        usdSurcharge, 
        baseRate, 
        extraRatePerKg, 
        discountType, 
        discountValue 
      });
      await config.save();
    }

    // যদি সব ক্লাইন্ট আপডেট করতে চান
    if (updateAllClients) {
      await Client.updateMany({}, {
        ratePerKg,
        usdSurcharge,
        baseRate,
        extraRatePerKg,
        discountType,
        discountValue
      });
    }

    res.json({ success: true, config });
  } catch (error) {
    console.error('RateConfig Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET - Fetch RateConfig
router.get('/', async (req, res) => {
  try {
    const config = await RateConfig.findOne();
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;