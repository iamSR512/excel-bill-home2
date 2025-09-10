const express = require('express');
const router = express.Router();
const RateConfig = require('../models/RateConfig');

// POST - Save or Update RateConfig
router.post('/', async (req, res) => {
  try {
    const { ratePerKg, usdSurcharge } = req.body;

    // Check if config exists
    let config = await RateConfig.findOne();
    if (config) {
      config.ratePerKg = ratePerKg;
      config.usdSurcharge = usdSurcharge;
      await config.save();
    } else {
      config = new RateConfig({ ratePerKg, usdSurcharge });
      await config.save();
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
