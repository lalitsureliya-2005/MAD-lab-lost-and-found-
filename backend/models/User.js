const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  fcmToken: { type: String, default: null }, // Store device token here for Push Notifications
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
