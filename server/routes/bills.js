const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const XLSX = require('xlsx');

// Get all bills
router.get('/', async (req, res) => {
  try {
    const bills = await Bill.find().sort({ submittedAt: -1 }).populate('submittedBy', 'username');
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Process Excel file and return data
router.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.excelFile) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const excelFile = req.files.excelFile;
    const workbook = XLSX.read(excelFile.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Format data for frontend
    const formattedData = data.map((row, index) => ({
      id: index + 1,
      customerName: row['নাম'] || row['Name'] || row['Customer Name'] || 'N/A',
      customerNumber: row['নাম্বার'] || row['Number'] || row['Customer Number'] || 'N/A',
      productName: row['প্রডাক্ট নাম'] || row['Product'] || row['Product Name'] || 'N/A',
      billAmount: parseFloat(row['বিল এমাউন্ট'] || row['Amount'] || row['Bill Amount'] || 0)
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit a bill
router.post('/submit', async (req, res) => {
  try {
    const { customerName, customerNumber, productName, billAmount, discountPercent, excelData } = req.body;
    
    const finalAmount = billAmount - (billAmount * (discountPercent / 100));
    
    const newBill = new Bill({
      customerName,
      customerNumber,
      productName,
      billAmount,
      discountPercent,
      finalAmount,
      excelData,
      submittedBy: req.userId // From authentication middleware
    });

    const savedBill = await newBill.save();
    res.status(201).json(savedBill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a bill
router.put('/:id', async (req, res) => {
  try {
    const { discountPercent } = req.body;
    const bill = await Bill.findById(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    bill.discountPercent = discountPercent;
    bill.finalAmount = bill.billAmount - (bill.billAmount * (discountPercent / 100));
    
    const updatedBill = await bill.save();
    res.json(updatedBill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a bill
router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bills by customer
router.get('/customer/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    
    const bills = await Bill.find({
      $or: [
        { customerName: { $regex: identifier, $options: 'i' } },
        { customerNumber: { $regex: identifier, $options: 'i' } }
      ]
    }).sort({ submittedAt: -1 });
    
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;