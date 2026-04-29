const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  type: { type: String, default: 'nearby-item' },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
