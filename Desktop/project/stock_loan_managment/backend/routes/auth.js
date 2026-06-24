const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (forces role to member) / Admin (can set any role)
router.post('/register', async (req, res) => {
  const { fullName, username, phone, password, role } = req.body;

  try {
    // Check if user already exists
    const userExistsByUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (userExistsByUsername) {
      return res.status(400).json({ success: false, message: 'Username is already registered' });
    }

    const userExistsByPhone = await User.findOne({ phone: phone.trim() });
    if (userExistsByPhone) {
      return res.status(400).json({ success: false, message: 'Phone number is already registered' });
    }

    // Role handling
    let finalRole = 'member';
    
    // Check if requester is Admin attempting to set a role
    if (role && role !== 'member') {
      let isAdmin = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
          const requester = await User.findById(decoded.id);
          if (requester && requester.role === 'admin') {
            isAdmin = true;
          }
        } catch (err) {
          // Token invalid, ignore and default to 'member'
        }
      }

      if (isAdmin) {
        finalRole = role;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Only admins can register managers or other admin accounts',
        });
      }
    }

    // Create user
    const user = await User.create({
      fullName,
      username: username.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: finalRole,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { usernameOrPhone, password } = req.body;

  if (!usernameOrPhone || !password) {
    return res.status(400).json({ success: false, message: 'Please provide credentials' });
  }

  try {
    const cleanCredential = usernameOrPhone.trim();
    
    // Look up user by username (lowercase) or phone
    const user = await User.findOne({
      $or: [
        { username: cleanCredential.toLowerCase() },
        { phone: cleanCredential }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all users (for managers / admins)
// @route   GET /api/users
// @access  Private (Admin / Manager only)
router.get('/users', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    // Return all users sorted by name
    const users = await User.find({}).select('-password').sort({ fullName: 1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a user (admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Do not allow admin to delete themselves
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot delete themselves' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
