const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ productName: 1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin / Manager only)
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  const { productName, pricePerUnit } = req.body;

  if (!productName || pricePerUnit === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide all details' });
  }

  try {
    const productExists = await Product.findOne({ productName: productName.trim() });
    if (productExists) {
      return res.status(400).json({ success: false, message: 'Product already exists' });
    }

    const product = await Product.create({
      productName: productName.trim(),
      pricePerUnit,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin / Manager only)
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  const { productName, pricePerUnit } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (productName) product.productName = productName.trim();
    if (pricePerUnit !== undefined) product.pricePerUnit = pricePerUnit;

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
