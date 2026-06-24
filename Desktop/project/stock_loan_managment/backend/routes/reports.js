const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');
const { getUserStock } = require('./storage');
const { getUserLoanDebt } = require('./loans');
const Savings = require('../models/Savings');
const { getUserSavingsBalance } = require('./savings');

// @desc    Get overall dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private (Admin / Manager only)
router.get('/dashboard', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    // 1. Members count
    const memberCount = await User.countDocuments({ role: 'member' });
    const managerCount = await User.countDocuments({ role: 'manager' });

    // 2. Stock inventory value
    const products = await Product.find({});
    const deposits = await Deposit.aggregate([
      { $group: { _id: '$product', total: { $sum: '$quantity' } } }
    ]);
    const withdrawals = await Withdrawal.aggregate([
      { $group: { _id: '$product', total: { $sum: '$quantity' } } }
    ]);

    const depositMap = {};
    deposits.forEach(d => { depositMap[d._id.toString()] = d.total; });

    const withdrawMap = {};
    withdrawals.forEach(w => { withdrawMap[w._id.toString()] = w.total; });

    let totalWarehouseValue = 0;
    const stockSummary = products.map(p => {
      const depQty = depositMap[p._id.toString()] || 0;
      const withQty = withdrawMap[p._id.toString()] || 0;
      const currentStock = depQty - withQty;
      const currentStockClamped = currentStock > 0 ? currentStock : 0;
      const value = currentStockClamped * p.pricePerUnit;
      
      totalWarehouseValue += value;
      
      return {
        productId: p._id,
        productName: p.productName,
        pricePerUnit: p.pricePerUnit,
        currentStock: currentStockClamped,
        value,
      };
    });

    // 3. Loans statistics
    const loans = await Loan.find({ status: 'approved' });
    const totalLoansIssued = loans.reduce((sum, l) => sum + l.amount, 0);

    const payments = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const totalPaymentsReceived = payments.length > 0 ? payments[0].total : 0;
    const outstandingDebt = totalLoansIssued - totalPaymentsReceived;

    const pendingLoanCount = await Loan.countDocuments({ status: 'pending' });

    // 4. Recent activities (mix of deposits, withdrawals, loans)
    const recentDeposits = await Deposit.find({})
      .populate('user', 'fullName')
      .populate('product', 'productName')
      .sort({ date: -1 })
      .limit(5);

    const recentLoans = await Loan.find({})
      .populate('user', 'fullName')
      .sort({ date: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        memberCount,
        managerCount,
        totalWarehouseValue,
        totalLoansIssued,
        totalPaymentsReceived,
        outstandingDebt: outstandingDebt > 0 ? outstandingDebt : 0,
        pendingLoanCount,
      },
      stockSummary,
      recentActivities: {
        deposits: recentDeposits,
        loans: recentLoans,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get detailed report for a specific member
// @route   GET /api/reports/member/:userId
// @access  Private
router.get('/member/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Authorization check: members can only fetch their own report
    if (req.user.role === 'member' && req.user.id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const member = await User.findById(userId).select('-password');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // 1. Stock details
    const stockLevels = await getUserStock(userId);
    const totalStoredValue = stockLevels.reduce((sum, item) => sum + item.currentValue, 0);

    // 2. Loan details
    const loanSummary = await getUserLoanDebt(userId);
    const maxCreditLimit = totalStoredValue * 0.70;
    const availableCredit = maxCreditLimit - loanSummary.outstandingDebt;

    // 3. Activity histories
    const deposits = await Deposit.find({ user: userId })
      .populate('product', 'productName pricePerUnit')
      .sort({ date: -1 });

    const withdrawals = await Withdrawal.find({ user: userId })
      .populate('product', 'productName pricePerUnit')
      .sort({ date: -1 });

    const loans = await Loan.find({ user: userId })
      .populate('approvedBy', 'fullName')
      .sort({ date: -1 });

    // Fetch payments for each loan
    const loanIds = loans.map(l => l._id);
    const payments = await Payment.find({ loan: { $in: loanIds } })
      .populate({
        path: 'loan',
        select: 'amount date status'
      })
      .sort({ date: -1 });

    res.json({
      success: true,
      member,
      summary: {
        totalStoredValue,
        maxCreditLimit,
        availableCredit: availableCredit > 0 ? availableCredit : 0,
        ...loanSummary,
      },
      stockLevels,
      deposits,
      withdrawals,
      loans,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
