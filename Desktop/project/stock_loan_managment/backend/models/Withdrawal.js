const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please associate a user (member)'],
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Please associate a product'],
  },
  quantity: {
    type: Number,
    required: [true, 'Please add a quantity'],
    min: [0.01, 'Quantity must be greater than 0'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);
