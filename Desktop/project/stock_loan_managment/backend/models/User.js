const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add a full name'],
    trim: true,
  },
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'member'],
    default: 'member',
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
