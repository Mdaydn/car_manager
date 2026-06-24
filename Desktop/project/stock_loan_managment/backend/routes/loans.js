const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { getUserStock } = require('./storage');
const { getUserSavingsBalance } = require('./savings');

// Helper to get outstanding loan debt for a user
const getUserLoanDebt = async (userId) => {
  // Find all approved loans for this user
  const approvedLoans = await Loan.find({ user: userId, status: 'approved' });
  const loanIds = approvedLoans.map(l => l._id);

  if (loanIds.length === 0) {
    return { totalBorrowed: 0, totalRepaid: 0, outstandingDebt: 0 };
  }

  // Sum payments for these loans
  const payments = await Payment.aggregate([
    { $match: { loan: { $in: loanIds } } },
    { $group: { _id: null, total: { $sum: '$amountPaid' } } }
  ]);

  const totalBorrowed = approvedLoans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalRepaid = payments.length > 0 ? payments[0].total : 0;
  const outstandingDebt = totalBorrowed - totalRepaid;

  return {
    totalBorrowed,
    totalRepaid,
    outstandingDebt: outstandingDebt > 0 ? outstandingDebt : 0
  };
};

// Helper to get remaining balance of a single loan
const getLoanRemainingBalance = async (loanId) => {
  const loan = await Loan.findById(loanId);
  if (!loan) return 0;

  if (loan.status !== 'approved') return 0;

  const payments = await Payment.aggregate([
    { $match: { loan: new mongoose.Types.ObjectId(loanId) } },
    { $group: { _id: null, total: { $sum: '$amountPaid' } } }
  ]);

  const totalRepaid = payments.length > 0 ? payments[0].total : 0;
  const remaining = loan.amount - totalRepaid;
  return remaining > 0 ? remaining : 0;
};

// @desc    Get all loans
// @route   GET /api/loans
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'member') {
      query = { user: req.user.id };
    }

    const loans = await Loan.find(query)
      .populate('user', 'fullName username phone')
      .populate('approvedBy', 'fullName username')
      .sort({ date: -1 });

    // Fetch payments for each loan to attach remaining balance
    const loansWithBalance = await Promise.all(
      loans.map(async (loan) => {
        let remainingBalance = 0;
        if (loan.status === 'approved') {
          remainingBalance = await getLoanRemainingBalance(loan._id);
        } else if (loan.status === 'pending') {
          remainingBalance = loan.amount;
        }

        return {
          ...loan.toObject(),
          remainingBalance,
        };
      })
    );

    res.json({ success: true, loans: loansWithBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get loan details and payment history
// @route   GET /api/loans/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('user', 'fullName username phone')
      .populate('approvedBy', 'fullName username');

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (req.user.role === 'member' && loan.user._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const payments = await Payment.find({ loan: loan._id }).sort({ date: -1 });
    const remainingBalance = loan.status === 'approved' ? await getLoanRemainingBalance(loan._id) : loan.amount;

    res.json({
      success: true,
      loan: {
        ...loan.toObject(),
        remainingBalance,
      },
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Request a loan
// @route   POST /api/loans/request
// @access  Private
router.post('/request', protect, async (req, res) => {
  const { amount } = req.body;
  let userId = req.body.userId;

  // If requester is member, force the userId to be their own id
  if (req.user.role === 'member') {
    userId = req.user.id;
  }

  if (!userId || !amount) {
    return res.status(400).json({ success: false, message: 'Please provide user ID and amount' });
  }

  const loanAmount = parseFloat(amount);
  if (isNaN(loanAmount) || loanAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Loan amount must be a positive number' });
  }

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Business Rule Check: Calculate total stock value and savings balance
    const stockLevels = await getUserStock(userId);
    const totalStoredValue = stockLevels.reduce((sum, item) => sum + item.currentValue, 0);
    const { balance: savingsBalance } = await getUserSavingsBalance(userId);
    const maxCreditLimit = (totalStoredValue * 0.70) + savingsBalance; // 70% of stored stock value + 100% of cash savings

    // Calculate outstanding debt
    const { outstandingDebt } = await getUserLoanDebt(userId);

    // Remaining credit limit
    const availableCredit = maxCreditLimit - outstandingDebt;

    if (loanAmount > availableCredit) {
      return res.status(400).json({
        success: false,
        message: `Loan request of $${loanAmount.toFixed(2)} exceeds available credit limit. Total stored stock value is $${totalStoredValue.toFixed(2)} (70% limit = $${(totalStoredValue * 0.70).toFixed(2)}) and cash savings balance is $${savingsBalance.toFixed(2)}. Current outstanding loan debt is $${outstandingDebt.toFixed(2)}. Maximum new loan allowed is $${(availableCredit > 0 ? availableCredit : 0).toFixed(2)}.`,
      });
    }

    // Create loan request (pending)
    const loan = await Loan.create({
      user: userId,
      amount: loanAmount,
      status: 'pending',
    });

    res.status(201).json({ success: true, loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Approve a loan
// @route   POST /api/loans/:id/approve
// @access  Private (Admin only)
router.post('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Loan is already ${loan.status}` });
    }

    // Check again if member still qualifies (just in case they withdrew stock/savings in the meantime)
    const stockLevels = await getUserStock(loan.user);
    const totalStoredValue = stockLevels.reduce((sum, item) => sum + item.currentValue, 0);
    const { balance: savingsBalance } = await getUserSavingsBalance(loan.user);
    const maxCreditLimit = (totalStoredValue * 0.70) + savingsBalance;
    const { outstandingDebt } = await getUserLoanDebt(loan.user);
    const availableCredit = maxCreditLimit - outstandingDebt;

    if (loan.amount > availableCredit) {
      // Reject automatically due to insufficient stock/savings value now
      loan.status = 'rejected';
      loan.approvedBy = req.user.id;
      await loan.save();
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Stock or savings value has decreased. Outstanding debt is $${outstandingDebt.toFixed(2)}, and credit limit is $${maxCreditLimit.toFixed(2)} (70% stock: $${(totalStoredValue * 0.70).toFixed(2)}, savings: $${savingsBalance.toFixed(2)}). Loan auto-rejected.`,
        loan
      });
    }

    loan.status = 'approved';
    loan.approvedBy = req.user.id;
    await loan.save();

    res.json({ success: true, loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reject a loan
// @route   POST /api/loans/:id/reject
// @access  Private (Admin only)
router.post('/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Loan is already ${loan.status}` });
    }

    loan.status = 'rejected';
    loan.approvedBy = req.user.id;
    await loan.save();

    res.json({ success: true, loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Record loan repayment
// @route   POST /api/loans/:id/pay
// @access  Private (Admin / Manager only)
router.post('/:id/pay', protect, authorize('admin', 'manager'), async (req, res) => {
  const { amountPaid } = req.body;

  if (!amountPaid) {
    return res.status(400).json({ success: false, message: 'Please provide amount paid' });
  }

  const paymentAmount = parseFloat(amountPaid);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Payment amount must be positive' });
  }

  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Repayment can only be recorded on approved loans' });
    }

    const remainingBalance = await getLoanRemainingBalance(loan._id);
    if (paymentAmount > remainingBalance + 0.01) { // small tolerance for float rounding
      return res.status(400).json({
        success: false,
        message: `Payment of $${paymentAmount.toFixed(2)} exceeds remaining loan balance of $${remainingBalance.toFixed(2)}`,
      });
    }

    const payment = await Payment.create({
      loan: loan._id,
      amountPaid: paymentAmount,
    });

    const newRemainingBalance = remainingBalance - paymentAmount;

    res.status(201).json({
      success: true,
      payment,
      remainingBalance: newRemainingBalance > 0 ? newRemainingBalance : 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user loan statement summary
// @route   GET /api/loans/debt/:userId
// @access  Private
router.get('/debt/:userId', protect, async (req, res) => {
  try {
    if (req.user.role === 'member' && req.user.id.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const summary = await getUserLoanDebt(req.params.userId);
    res.json({ success: true, ...summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { router, getUserLoanDebt, getLoanRemainingBalance };
