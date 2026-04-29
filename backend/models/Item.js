const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // e.g. Electronics, Books, Keys
  type: { type: String, required: true, enum: ['lost', 'found'] },
  location: { type: String }, // Classroom or Lab
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'available' }, // 'available', 'claimed'
  imageUrl: { type: String },
  reporterEmail: { type: String },
  reporterPhone: { type: String },
  expoPushToken: { type: String }, // For push notifications when matching
  
  claimedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Item', itemSchema);
