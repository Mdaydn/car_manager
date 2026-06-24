const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_loan_movement';

const seedDB = async () => {
  try {
    await mongoose.connect(dbUri);
    console.log('Connected to DB for seeding...');

    // Delete existing admin user with same username to avoid duplicate key error
    await User.deleteMany({ username: 'dieudonne' });
    
    // Seed default Admin
    const adminUser = new User({
      fullName: 'Dieudonne Admin',
      username: 'dieudonne',
      phone: '0780000000',
      role: 'admin',
      password: 'midmid@@', // Password will be automatically hashed by UserSchema's pre-save middleware
    });
    
    await adminUser.save();
    console.log('Default admin user (dieudonne) created successfully.');

    // Seed some initial products if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const products = [
        { productName: 'Maize', pricePerUnit: 1.50 },
        { productName: 'Beans', pricePerUnit: 2.20 },
        { productName: 'Rice', pricePerUnit: 3.00 },
        { productName: 'Wheat', pricePerUnit: 1.80 },
      ];
      await Product.insertMany(products);
      console.log('Default products seeded successfully.');
    } else {
      console.log('Products already exist, skipping product seed.');
    }

    await mongoose.connection.close();
    console.log('Database seeding finished.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
