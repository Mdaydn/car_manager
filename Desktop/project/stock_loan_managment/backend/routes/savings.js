const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Savings = require('../models/Savings');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Helper to get savings balance for a user
const getUserSavingsBalance = async (userId) => {
  const objectId = new mongoose.Types.ObjectId(userId);
  
  const deposits = await Savings.aggregate([
    { $match: { user: objectId, type: 'deposit' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const withdrawals = await Savings.aggregate([
    { $match: { user: objectId, type: 'withdrawal' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalDeposited = deposits.length > 0 ? deposits[0].total : 0;
  const totalWithdrawn = withdrawals.length > 0 ? withdrawals[0].total : 0;
  const balance = totalDeposited - totalWithdrawn;

  return {
    totalDeposited,
    totalWithdrawn,
    balance: balance > 0 ? balance : 0,
  };
};

// @desc    Get current savings balance for a user
// @route   GET /api/savings/balance/:userId
// @access  Private
router.get('/balance/:userId', protect, async (req, res) => {
  try {
    // If member, only allow requesting their own savings balance
    if (req.user.role === 'member' && req.user.id.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const balanceData = await getUserSavingsBalance(req.params.userId);
    res.json({ success: true, ...balanceData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all savings transactions (filtered by credential)
// @route   GET /api/savings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // If member, only get their own savings transactions
    if (req.user.role === 'member') {
      query = { user: req.user.id };
    }

    // Populate user details (fullName, username, phone)
    const logs = await Savings.find(query)
      .populate('user', 'fullName username phone')
      .sort({ date: -1 });

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Record a new savings deposit
// @route   POST /api/savings/deposit
// @access  Private (Admin / Manager only)
router.post('/deposit', protect, authorize('admin', 'manager'), async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ success: false, message: 'Please provide user ID and amount' });
  }

  const depositAmt = parseFloat(amount);
  if (isNaN(depositAmt) || depositAmt <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
  }

  try {
    // Verify member exists
    const member = await User.findById(userId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const log = await Savings.create({
      user: userId,
      amount: depositAmt,
      type: 'deposit',
    });

    res.status(201).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Record a new savings withdrawal
// @route   POST /api/savings/withdraw
// @access  Private (Admin / Manager only)
router.post('/withdraw', protect, authorize('admin', 'manager'), async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ success: false, message: 'Please provide user ID and amount' });
  }

  const withdrawAmt = parseFloat(amount);
  if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
  }

  try {
    // Verify member exists
    const member = await User.findById(userId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Business Rule Check: Verify user has enough savings balance
    const { balance } = await getUserSavingsBalance(userId);

    if (withdrawAmt > balance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient savings balance. Member only has $${balance.toFixed(2)} saved, but requested withdrawal of $${withdrawAmt.toFixed(2)}.`,
      });
    }

    const log = await Savings.create({
      user: userId,
      amount: withdrawAmt,
      type: 'withdrawal',
    });

    res.status(201).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { router, getUserSavingsBalance };
