const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// POST /api/admin/reset — Clears ALL collections and drops unused ones
// ⚠️  TEMPORARY ENDPOINT — Remove after use!
router.post('/reset', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // 1. Clear all active collections
    const collections = ['items', 'settlements', 'notifications', 'users'];
    for (const col of collections) {
      try {
        await db.collection(col).deleteMany({});
        console.log(`[Admin] Cleared collection: ${col}`);
      } catch (e) {
        console.log(`[Admin] Collection ${col} might not exist, skipping.`);
      }
    }

    // 2. Drop unused/legacy collections
    const legacyCollections = ['reviews', 'lostreports'];
    for (const col of legacyCollections) {
      try {
        await db.collection(col).drop();
        console.log(`[Admin] Dropped legacy collection: ${col}`);
      } catch (e) {
        console.log(`[Admin] Legacy collection ${col} might not exist, skipping.`);
      }
    }

    res.json({ 
      message: 'Database reset complete. All data cleared, unused collections dropped.',
      cleared: collections,
      dropped: legacyCollections
    });
  } catch (err) {
    console.error('[Admin Reset Error]', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
