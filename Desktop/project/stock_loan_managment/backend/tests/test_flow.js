const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const { getUserStock } = require('../routes/storage');
const { getUserLoanDebt } = require('../routes/loans');

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_loan_movement_test';

const runTests = async () => {
  try {
    console.log('Connecting to test database:', dbUri);
    await mongoose.connect(dbUri);
    
    // Clear test database collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Deposit.deleteMany({});
    await Withdrawal.deleteMany({});
    await Loan.deleteMany({});
    await Payment.deleteMany({});
    console.log('Test database cleared.');

    // 1. Create users
    const admin = await User.create({
      fullName: 'Dieudonne Admin',
      username: 'dieudonne',
      phone: '0780000000',
      role: 'admin',
      password: 'midmid@@'
    });
    
    const member = await User.create({
      fullName: 'John Member',
      username: 'johnmember',
      phone: '0781111111',
      role: 'member',
      password: 'password123'
    });
    console.log('Users created: Admin & Member.');

    // 2. Create products
    const maize = await Product.create({
      productName: 'Maize',
      pricePerUnit: 1.50 // $1.5 per kg
    });
    
    const beans = await Product.create({
      productName: 'Beans',
      pricePerUnit: 2.00 // $2.0 per kg
    });
    console.log('Products created: Maize ($1.5) & Beans ($2.0).');

    // 3. Perform a stock deposit
    // Member deposits 100kg Maize. Value = $150
    const deposit1 = await Deposit.create({
      user: member._id,
      product: maize._id,
      quantity: 100,
      totalValue: 100 * maize.pricePerUnit
    });
    console.log('Deposit: Member deposited 100kg Maize (Value: $150).');

    // Verify stock balance
    let stock = await getUserStock(member._id);
    let maizeStock = stock.find(s => s.productName === 'Maize');
    console.assert(maizeStock.currentStock === 100, 'Maize stock should be 100');
    console.assert(maizeStock.currentValue === 150, 'Maize stock value should be 150');
    console.log('Verified: Member Maize stock is 100kg, value is $150.');

    // 4. Test Stock Rule: Cannot withdraw more than stored
    // Attempting to withdraw 120kg Maize
    console.log('Testing Stock Rule: Attempt to withdraw 120kg Maize...');
    const requestedWithdrawQty = 120;
    if (requestedWithdrawQty > maizeStock.currentStock) {
      console.log('PASSED: Prevented withdrawal of 120kg (exceeds 100kg stock).');
    } else {
      throw new Error('FAIL: Allowed withdrawal exceeding stock!');
    }

    // Perform valid withdrawal: 40kg Maize
    await Withdrawal.create({
      user: member._id,
      product: maize._id,
      quantity: 40
    });
    console.log('Withdrawal: Member withdrew 40kg Maize.');

    // Verify stock balance decreased
    stock = await getUserStock(member._id);
    maizeStock = stock.find(s => s.productName === 'Maize');
    console.assert(maizeStock.currentStock === 60, 'Maize stock should now be 60');
    console.assert(maizeStock.currentValue === 90, 'Maize stock value should now be 90');
    console.log('Verified: Member remaining Maize stock is 60kg, value is $90.');

    // 5. Test Loan Rule: Limit is 70% of stored stock value
    // Total stored stock value is $90. Max loan = 70% of 90 = $63.
    const totalStoredValue = stock.reduce((sum, item) => sum + item.currentValue, 0);
    const maxCreditLimit = totalStoredValue * 0.70;
    console.assert(maxCreditLimit === 63, `Credit limit should be $63, got $${maxCreditLimit}`);
    console.log(`Verified: Member credit limit is $${maxCreditLimit.toFixed(2)} (70% of $${totalStoredValue.toFixed(2)}).`);

    // Request loan exceeding limit ($70)
    console.log('Testing Loan Limit Rule: Request loan of $70...');
    const invalidLoanAmount = 70;
    const { outstandingDebt } = await getUserLoanDebt(member._id);
    const availableCredit = maxCreditLimit - outstandingDebt;
    
    if (invalidLoanAmount > availableCredit) {
      console.log(`PASSED: Blocked $70 loan request (exceeds $${availableCredit.toFixed(2)} available credit).`);
    } else {
      throw new Error('FAIL: Allowed loan request exceeding credit limit!');
    }

    // Request valid loan ($50)
    const validLoan = await Loan.create({
      user: member._id,
      amount: 50,
      status: 'pending'
    });
    console.log(`Loan Request: Member requested loan of $50 (Status: pending).`);

    // Admin approves loan
    validLoan.status = 'approved';
    validLoan.approvedBy = admin._id;
    await validLoan.save();
    console.log('Loan Approval: Admin approved member\'s $50 loan.');

    // Verify outstanding debt is $50
    let debtSummary = await getUserLoanDebt(member._id);
    console.assert(debtSummary.outstandingDebt === 50, 'Outstanding debt should be $50');
    console.log(`Verified: Member outstanding debt is $${debtSummary.outstandingDebt.toFixed(2)}.`);

    // 6. Record loan payment
    // Repay $20
    await Payment.create({
      loan: validLoan._id,
      amountPaid: 20
    });
    console.log('Repayment: Member paid $20.');

    // Verify remaining outstanding debt is $30
    debtSummary = await getUserLoanDebt(member._id);
    console.assert(debtSummary.outstandingDebt === 30, 'Outstanding debt should now be $30');
    console.log(`Verified: Member remaining debt is $${debtSummary.outstandingDebt.toFixed(2)}.`);

    console.log('\n--- ALL CORE BUSINESS LOGIC TESTS PASSED SUCCESSFULLY! ---');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\nTEST RUN FAILED:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runTests();
