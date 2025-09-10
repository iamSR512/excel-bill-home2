const express = require('express');
const Client = require('../models/Client');
const RateConfig = require('../models/RateConfig'); // ✅ Global Config import
const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find()
      .populate('registeredBy', 'name email')
      .sort({ registrationDate: -1 });

    res.json({
      success: true,
      clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error.message
    });
  }
});

// Register a new client
router.post('/register', async (req, res) => {
  try {
    const { name, address, email, phone, registeredBy } = req.body;

    const existingClient = await Client.findOne({
      name: name.trim(),
      address: address.trim()
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client already registered with this name and address'
      });
    }

    // ✅ Global Config নিন
    const globalConfig = await RateConfig.findOne().sort({ updatedAt: -1 });

    const client = new Client({
      name: name.trim(),
      address: address.trim(),
      email: email || '',
      phone: phone || '',
      registeredBy,
      ratePerKg: globalConfig?.ratePerKg ?? 0,
      usdSurcharge: globalConfig?.usdSurcharge ?? 0
    });

    await client.save();
    await client.populate('registeredBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Client registered successfully',
      client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Client registration failed',
      error: error.message
    });
  }
});

// Check if a client is already registered
router.post('/check', async (req, res) => {
  try {
    const { name, address } = req.body;

    const client = await Client.findOne({
      name: name.trim(),
      address: address.trim()
    });

    res.json({
      success: true,
      isRegistered: !!client,
      client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check client',
      error: error.message
    });
  }
});

// Update client (Rate Config or other info)
router.put('/:id', async (req, res) => {
  try {
    const { ratePerKg, usdSurcharge } = req.body;

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { ratePerKg, usdSurcharge },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({ success: true, client: updatedClient });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Update failed',
      error: error.message
    });
  }
});

// Add rate configuration to client (specific rules)
router.post('/:id/rates', async (req, res) => {
  try {
    const { shipperAddressPattern, weight, rate } = req.body;
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    client.rateConfigurations.push({ shipperAddressPattern, weight, rate });
    await client.save();
    
    res.json({ 
      success: true,
      message: 'Rate configuration added successfully',
      rateConfig: client.rateConfigurations[client.rateConfigurations.length - 1]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to add rate configuration', 
      error: error.message 
    });
  }
});

module.exports = router;
