const mongoose = require('mongoose');

const SavingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please associate a user (member)'],
  },
  amount: {
    type: Number,
    required: [true, 'Please specify savings amount'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: [true, 'Please specify transaction type (deposit or withdrawal)'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Savings', SavingsSchema);
