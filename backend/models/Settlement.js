const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  itemName:        { type: String, required: true },
  itemType:        { type: String, enum: ['lost', 'found'] },
  founderEmail:    { type: String, required: true },   // Person who FOUND the item
  receiverEmail:   { type: String, required: true },   // Person who LOST the item (gets it back)
  thankYouMessage: { type: String, default: '' },
  createdAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settlement', settlementSchema);
