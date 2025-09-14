const express = require('express');
const Client = require('../models/Client');
const RateConfig = require('../models/RateConfig');
const router = express.Router();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://excel-bill-home2-oglb.vercel.app'
];

// CORS middleware for this router
router.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && (origin.includes('vercel.app') || origin.includes('localhost')))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  next();
});

// Handle preflight requests for all routes in this router
router.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && (origin.includes('vercel.app') || origin.includes('localhost')))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.sendStatus(200);
});

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

    // Check for duplicate client by name and address
    const existingClient = await Client.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      address: { $regex: new RegExp(`^${address.trim()}$`, 'i') }
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client already registered with this name and address',
        existingClient
      });
    }

    // সর্বশেষ ক্লায়েন্ট ID খুঁজে বের করুন
    const lastClient = await Client.findOne().sort({ clientId: -1 });
    let nextClientId = "IM001";
    
    if (lastClient && lastClient.clientId) {
      // ClientId থেকে সংখ্যা部分 বের করুন
      const idNumber = parseInt(lastClient.clientId.replace('IM', ''));
      if (!isNaN(idNumber)) {
        nextClientId = `IM${(idNumber + 1).toString().padStart(3, '0')}`;
      }
    }

    // Global Config নিন
    const globalConfig = await RateConfig.findOne().sort({ updatedAt: -1 });

    const client = new Client({
      clientId: nextClientId,
      name: name.trim(),
      address: address.trim(),
      email: email || '',
      phone: phone || '',
      registeredBy,
      baseRate: globalConfig?.baseRate ?? 0,
      extraRatePerKg: globalConfig?.extraRatePerKg ?? 0,
      discountType: globalConfig?.discountType ?? 'percentage',
      discountValue: globalConfig?.discountValue ?? 0,
      clientType: 'REGULAR'
    });

    await client.save();
    await client.populate('registeredBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Client registered successfully',
      client
    });
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res.status(400).json({
        success: false,
        message: 'Client already exists with this name and address'
      });
    }
    
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
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      address: { $regex: new RegExp(`^${address.trim()}$`, 'i') }
    }).populate('registeredBy', 'name email');

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

// Check for duplicate client
router.post('/check-duplicate', async (req, res) => {
  try {
    const { name, address } = req.body;

    const client = await Client.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      address: { $regex: new RegExp(`^${address.trim()}$`, 'i') }
    });

    res.json({
      success: true,
      isDuplicate: !!client,
      client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check duplicate client',
      error: error.message
    });
  }
});

// Update client (Rate Config or other info)
router.put('/:id', async (req, res) => {
  try {
    const { baseRate, extraRatePerKg, discountType, discountValue, email, clientType } = req.body;

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { 
        baseRate, 
        extraRatePerKg, 
        discountType, 
        discountValue,
        email,
        clientType,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('registeredBy', 'name email');

    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({ 
      success: true, 
      message: 'Client updated successfully',
      client: updatedClient 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Update failed',
      error: error.message
    });
  }
});

// Delete a client
router.delete('/:id', async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    
    if (!deletedClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
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
      return res.status(404).json({ 
        success: false,
        message: 'Client not found' 
      });
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

// Get a specific client by ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('registeredBy', 'name email');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client',
      error: error.message
    });
  }
});

// Existing clients-কে clientId প্রদানের জন্য API
router.post('/assign-client-ids', async (req, res) => {
  try {
    const clients = await Client.find().sort({ registrationDate: 1 });
    
    for (let i = 0; i < clients.length; i++) {
      const clientId = `IM${(i + 1).toString().padStart(3, '0')}`;
      await Client.findByIdAndUpdate(clients[i]._id, { clientId });
    }
    
    res.json({
      success: true,
      message: 'Client IDs assigned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign client IDs',
      error: error.message
    });
  }
});

module.exports = router;