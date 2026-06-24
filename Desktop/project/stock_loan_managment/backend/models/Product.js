const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Please add a product name'],
    unique: true,
    trim: true,
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Please add a price per unit'],
    min: [0, 'Price cannot be negative'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema);
