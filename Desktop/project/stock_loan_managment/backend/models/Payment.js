const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: [true, 'Please associate a loan'],
  },
  amountPaid: {
    type: Number,
    required: [true, 'Please add a payment amount'],
    min: [0.01, 'Payment amount must be greater than 0'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Payment', PaymentSchema);
