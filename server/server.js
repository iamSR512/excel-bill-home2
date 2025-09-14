const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const clientRoutes = require('./routes/clients');
const app = express();
const Client = require('./models/Client');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use('/api/clients', clientRoutes);
app.use('/api/rate-config', require('./routes/rateConfig'));

// MongoDB connection - Atlas cluster ব্যবহার করুন
const MONGODB_URI = 'mongodb+srv://mern:gpGPSjUAqIaazWFi@cluster7.gynar.mongodb.net/excel-bill-management?retryWrites=true&w=majority&appName=Cluster7';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Atlas Connected Successfully'))
.catch(err => console.error('MongoDB Connection Error:', err));

// User Model
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Bill Model - সম্পূর্ণ আপডেট করা হয়েছে
const BillSchema = new mongoose.Schema({
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  items: [{
    id: String,
    awbNo: String,
    shipper: String,
    shipperAddress: String,
    dest: String,
    cneeAddress: String,
    nop: String,
    wt: String,
    product: String,
    cod: String,
    val: String,
    binVat: String,
    price: Number,
    quantity: Number,
    discount: Number,
    total: Number
  }],
  grandTotal: Number,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'Pending' },
  submissionDate: { type: Date, default: Date.now }
});

const Bill = mongoose.model('Bill', BillSchema);

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

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
  }
});

// Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }
    
    const decoded = jwt.verify(token, 'your-secret-key');
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// isAdmin middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, 'your-secret-key');
    res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
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
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, 'your-secret-key');
     console.log('Login successful for user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    res.json({ 
      success: true,
      message: 'Login successful',
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
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

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Debugging: headers দেখুন
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    let headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: range.s.r };
      const cellRef = xlsx.utils.encode_cell(cellAddress);
      const cell = worksheet[cellRef];
      headers.push(cell ? cell.v : `Column ${C}`);
    }
    console.log('Excel Headers:', headers);
    
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    console.log('Excel Data:', jsonData);
    
    // Process the Excel data - manually extract data
    const items = [];
    let row = 1; // Data শুরু হয় কোন row থেকে (0-based)
    
    while (true) {
      const nameCell = worksheet[xlsx.utils.encode_cell({ r: row, c: 0 })]; // Column A
      const phoneCell = worksheet[xlsx.utils.encode_cell({ r: row, c: 1 })]; // Column B
      const productCell = worksheet[xlsx.utils.encode_cell({ r: row, c: 2 })]; // Column C
      const amountCell = worksheet[xlsx.utils.encode_cell({ r: row, c: 3 })]; // Column D
      
      if (!nameCell && !phoneCell && !productCell && !amountCell) break;
      
      const customerName = nameCell ? nameCell.v : '';
      const phone = phoneCell ? phoneCell.v.toString() : '';
      const product = productCell ? productCell.v : '';
      
      let amount = 0;
      if (amountCell) {
        if (typeof amountCell.v === 'string') {
          amount = parseFloat(amountCell.v.replace(/[^\d.]/g, '')) || 0;
        } else {
          amount = parseFloat(amountCell.v) || 0;
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
      
      row++;
    }

    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
    
    // Temporary file delete করুন
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.json({ 
      success: true, 
      items, 
      grandTotal,
      message: 'File processed successfully'
    });
  } catch (error) {
    console.error('File processing error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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
    
    const { customerName, customerEmail, customerPhone, items, grandTotal } = req.body;
    
    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Customer name and items are required' 
      });
    }
    
    // Validate each item
    const validatedItems = items.map(item => ({
      id: item.id || '',
      awbNo: item.awbNo || '',
      shipper: item.shipper || '',
      shipperAddress: item.shipperAddress || '',
      dest: item.dest || '',
      cneeAddress: item.cneeAddress || '',
      nop: item.nop || '',
      wt: item.wt || '',
      product: item.product || '',
      cod: item.cod || '',
      val: item.val || '',
      binVat: item.binVat || '',
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      discount: parseInt(item.discount) || 0,
      total: parseFloat(item.total) || 0
    }));
    
    const bill = new Bill({
      customerName,
      customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      customerPhone: customerPhone || '0000000000',
      items: validatedItems,
      grandTotal: parseFloat(grandTotal) || 0,
      submittedBy: req.user._id
    });
    
    await bill.save();
    
    // Populate the submittedBy field
    await bill.populate('submittedBy', 'name email');
    
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
      error: error.message // Development mode তে error message দেখাবে
    });
  }
});

// Get all bills (Admin only)
app.get('/api/bills', auth, isAdmin, async (req, res) => {
  try {
     console.log('Fetching bills for admin:', req.user.email);
    const bills = await Bill.find().populate('submittedBy', 'name email');
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

// Temporary route to create admin user (testing purposes)
app.post('/api/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: 'admin' 
    });
    
    await user.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user._id,
        name: user.name,
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});