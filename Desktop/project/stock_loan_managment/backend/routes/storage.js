const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Helper to get stock balance for a user across all products
const getUserStock = async (userId) => {
  const products = await Product.find({});
  
  // Aggregate deposits
  const deposits = await Deposit.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$product', total: { $sum: '$quantity' } } }
  ]);
  
  // Aggregate withdrawals
  const withdrawals = await Withdrawal.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$product', total: { $sum: '$quantity' } } }
  ]);
  
  const depositMap = {};
  deposits.forEach(d => {
    depositMap[d._id.toString()] = d.total;
  });
  
  const withdrawMap = {};
  withdrawals.forEach(w => {
    withdrawMap[w._id.toString()] = w.total;
  });
  
  const stockLevels = products.map(p => {
    const depQty = depositMap[p._id.toString()] || 0;
    const withQty = withdrawMap[p._id.toString()] || 0;
    const currentStock = depQty - withQty;
    const currentValue = currentStock * p.pricePerUnit;
    
    return {
      productId: p._id,
      productName: p.productName,
      pricePerUnit: p.pricePerUnit,
      deposited: depQty,
      withdrawn: withQty,
      currentStock: currentStock > 0 ? currentStock : 0,
      currentValue: currentStock > 0 ? currentValue : 0,
    };
  });
  
  return stockLevels;
};

// @desc    Get current stock levels for a user
// @route   GET /api/storage/balance/:userId
// @access  Private
router.get('/balance/:userId', protect, async (req, res) => {
  try {
    // If member, only allow requesting their own balance
    if (req.user.role === 'member' && req.user.id.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this user\'s stock balance' });
    }

    const stock = await getUserStock(req.params.userId);
    res.json({ success: true, stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all deposits
// @route   GET /api/storage/deposits
// @access  Private
router.get('/deposits', protect, async (req, res) => {
  try {
    let query = {};
    
    // If member, only get their own deposits
    if (req.user.role === 'member') {
      query = { user: req.user.id };
    }

    const deposits = await Deposit.find(query)
      .populate('user', 'fullName username phone')
      .populate('product', 'productName pricePerUnit')
      .sort({ date: -1 });

    res.json({ success: true, deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Record a new deposit
// @route   POST /api/storage/deposit
// @access  Private (Admin / Manager only)
router.post('/deposit', protect, authorize('admin', 'manager'), async (req, res) => {
  const { user, product, quantity } = req.body;

  if (!user || !product || !quantity) {
    return res.status(400).json({ success: false, message: 'Please provide user, product, and quantity' });
  }

  try {
    // Verify member exists
    const member = await User.findById(user);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Verify product exists
    const prod = await Product.findById(product);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const numericQuantity = parseFloat(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    // Calculate total value based on current product price
    const totalValue = numericQuantity * prod.pricePerUnit;

    const deposit = await Deposit.create({
      user,
      product,
      quantity: numericQuantity,
      totalValue,
    });

    res.status(201).json({ success: true, deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all withdrawals
// @route   GET /api/storage/withdrawals
// @access  Private
router.get('/withdrawals', protect, async (req, res) => {
  try {
    let query = {};

    // If member, only get their own withdrawals
    if (req.user.role === 'member') {
      query = { user: req.user.id };
    }

    const withdrawals = await Withdrawal.find(query)
      .populate('user', 'fullName username phone')
      .populate('product', 'productName pricePerUnit')
      .sort({ date: -1 });

    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Record a new withdrawal
// @route   POST /api/storage/withdraw
// @access  Private (Admin / Manager only)
router.post('/withdraw', protect, authorize('admin', 'manager'), async (req, res) => {
  const { user, product, quantity } = req.body;

  if (!user || !product || !quantity) {
    return res.status(400).json({ success: false, message: 'Please provide user, product, and quantity' });
  }

  try {
    // Verify member exists
    const member = await User.findById(user);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Verify product exists
    const prod = await Product.findById(product);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const numericQuantity = parseFloat(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    // Business Rule Check: Verify user has enough stock of this specific product
    const stockLevels = await getUserStock(user);
    const prodStock = stockLevels.find(s => s.productId.toString() === product.toString());
    const availableStock = prodStock ? prodStock.currentStock : 0;

    if (numericQuantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Member only has ${availableStock} units of ${prod.productName} stored, but requested withdrawal of ${numericQuantity} units.`,
      });
    }

    // Proceed with withdrawal
    const withdrawal = await Withdrawal.create({
      user,
      product,
      quantity: numericQuantity,
    });

    res.status(201).json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { router, getUserStock };
