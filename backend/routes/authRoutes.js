const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fetch JWT Secret from environment or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

// @route POST /api/auth/register
// @desc Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, fcmToken } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      fcmToken: fcmToken || null
    });

    await user.save();

    const payload = {
      user: { id: user.id }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route POST /api/auth/login
// @desc Authenticate user & get token (and optionally update fcmToken)
router.post('/login', async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Update FCM token if provided during login
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    const payload = {
      user: { id: user.id }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route GET /api/auth/me
// @desc Get logged in user details
router.get('/me', async (req, res) => {
    // Add lightweight JWT validation directly here or use the authMiddleware
    const token = req.header('Authorization')?.split(' ')[1] || req.header('x-auth-token');
    
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
});

module.exports = router;
