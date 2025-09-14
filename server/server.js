const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// CORS configuration - Enhanced for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://excel-bill-home2-oglb.vercel.app',
  'https://excel-bill-home2-oglb.vercel.app/'
];

// Handle preflight requests first
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.includes('vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.includes('vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mern:gpGPSjUAqIaazWFi@cluster7.gynar.mongodb.net/excel-bill-management?retryWrites=true&w=majority&appName=Cluster7';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Atlas Connected Successfully'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Import models from models directory
const User = require('./models/User');
const Bill = require('./models/Bill');

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /xlsx|xls|csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('শুধুমাত্র এক্সেল ফাইল অনুমোদিত'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/rate-config', require('./routes/rateConfig'));

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const user = new User({ username, email, password });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback-secret-key');
    res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      success: false,
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback-secret-key');
    console.log('Login successful for user:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    res.json({ 
      success: true,
      message: 'Login successful',
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ 
      success: false,
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// Excel file upload and processing
app.post('/api/upload', auth, upload.single('excelFile'), async (req, res) => {
  try {
    console.log('File received:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    console.log('Excel Data:', jsonData);
    
    const items = [];
    
    for (const row of jsonData) {
      const customerName = row['Customer Name'] || row['customerName'] || row['Name'] || '';
      const product = row['Product'] || row['product'] || '';
      let amount = 0;
      
      if (row['Amount'] || row['amount'] || row['Price'] || row['price']) {
        const amountValue = row['Amount'] || row['amount'] || row['Price'] || row['price'];
        if (typeof amountValue === 'string') {
          amount = parseFloat(amountValue.replace(/[^\d.]/g, '')) || 0;
        } else {
          amount = parseFloat(amountValue) || 0;
        }
      }
      
      if (customerName && customerName !== '학년' && amount > 0) {
        items.push({
          product: product,
          price: amount,
          quantity: 1,
          discount: 0,
          total: amount
        });
      }
    }

    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
    
    res.json({ 
      success: true, 
      items, 
      grandTotal,
      message: 'File processed successfully'
    });
  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ 
      success: false,
      message: 'File processing failed', 
      error: error.message 
    });
  }
});

// Bill submission
app.post('/api/submit-bill', auth, async (req, res) => {
  try {
    console.log('Received bill submission:', req.body);
    
    const { customerName, customerNumber, productName, billAmount, discountPercent, finalAmount, excelData } = req.body;
    
    if (!customerName || !customerNumber || !productName || !billAmount) {
      return res.status(400).json({ 
        success: false,
        message: 'Required fields are missing' 
      });
    }
    
    const bill = new Bill({
      customerName,
      customerNumber,
      productName,
      billAmount: parseFloat(billAmount),
      discountPercent: parseFloat(discountPercent) || 0,
      finalAmount: parseFloat(finalAmount),
      excelData,
      submittedBy: req.user._id
    });
    
    await bill.save();
    await bill.populate('submittedBy', 'username email');
    
    res.status(201).json({ 
      success: true,
      message: 'Bill submitted successfully', 
      billId: bill._id 
    });
  } catch (error) {
    console.error('Bill submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Bill submission failed', 
      error: error.message
    });
  }
});

// Get all bills (Admin only)
app.get('/api/bills', auth, isAdmin, async (req, res) => {
  try {
    console.log('Fetching bills for admin:', req.user.email);
    const bills = await Bill.find().populate('submittedBy', 'username email');
    console.log(`Found ${bills.length} bills`);
    res.json({ 
      success: true,
      bills 
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch bills', 
      error: error.message 
    });
  }
});

// Update bill status (Admin only)
app.put('/api/bills/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const bill = await Bill.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    res.json({ 
      success: true,
      message: 'Bill status updated successfully', 
      bill 
    });
  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update bill status', 
      error: error.message 
    });
  }
});

// User profile
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch profile', 
      error: error.message 
    });
  }
});

// Temporary route to create admin user
app.post('/api/create-admin', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }
    
    const user = new User({ 
      username, 
      email, 
      password, 
      role: 'admin' 
    });
    
    await user.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create admin user', 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString()
  });
});

// Production এ শুধুমাত্র API serve করুন
if (process.env.NODE_ENV === 'production') {
  // API রাউটস ছাড়া অন্য কোন রাউটে req আসলে error message দিন
  app.get('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found. Please use /api routes.',
      availableEndpoints: [
        '/api/health',
        '/api/register',
        '/api/login',
        '/api/upload',
        '/api/submit-bill',
        '/api/bills',
        '/api/profile'
      ]
    });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});