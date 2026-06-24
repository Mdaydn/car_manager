const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please associate a user (member)'],
  },
  amount: {
    type: Number,
    required: [true, 'Please add a loan amount'],
    min: [1, 'Loan amount must be at least 1'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Loan', LoanSchema);
