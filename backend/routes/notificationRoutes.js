const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get all notifications for a specific user email
router.get('/:email', async (req, res) => {
  try {
    const notifications = await Notification.find({ userEmail: req.params.email }).sort({ timestamp: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clear a specific notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clear all notifications for a user
router.delete('/clear-all/:email', async (req, res) => {
  try {
    await Notification.deleteMany({ userEmail: req.params.email });
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark all as read for a user
router.put('/mark-all-read/:email', async (req, res) => {
  try {
    await Notification.updateMany({ userEmail: req.params.email }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
