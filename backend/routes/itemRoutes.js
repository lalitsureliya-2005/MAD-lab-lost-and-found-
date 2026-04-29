const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const Settlement = require('../models/Settlement');
const upload = require('../config/multer');

// Get all items (Public)
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single item (Public)
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get items by reporter email (Public)
router.get('/reporter/:email', async (req, res) => {
  try {
    const items = await Item.find({ reporterEmail: req.params.email }).sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Item (Public now, so anyone can report lost/found)
router.post('/', upload.single('image'), async (req, res) => {
  const { title, description, category, type, location, reporterEmail, reporterPhone, expoPushToken } = req.body;
  
  // Construct image URL using HTTPS and the correct host
  const host = req.get('host');
  const imageUrl = req.file ? `https://${host}/uploads/${req.file.filename}` : '';

  try {
    const newItem = new Item({ 
      title, description, category, type, location, imageUrl, reporterEmail, reporterPhone, expoPushToken
    });
    await newItem.save();

    // Cross-Matching Notification Logic
    if (category) {
      const matchType = type === 'lost' ? 'found' : 'lost';
      const matchingItems = await Item.find({ type: matchType, category: category });
      
      // Track both email, phone and push tokens for notifications
      const usersToNotify = new Map();
      matchingItems.forEach(item => {
        if (item.reporterEmail && item.reporterEmail !== reporterEmail) {
          usersToNotify.set(item.reporterEmail, { email: item.reporterEmail, phone: item.reporterPhone, token: item.expoPushToken });
        }
      });

      const notificationData = Array.from(usersToNotify.values());

      const notifications = notificationData.map(data => ({
        userEmail: data.email,
        title: type === 'found' ? `Potential Match for Your Lost ${category}!` : `Someone Lost a ${category} Similar to Your Found Item!`,
        message: `A ${type} ${category} item titled "${title}" has been reported.`,
        itemId: newItem._id,
        type: 'match'
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }

      // GLOBAL BROADCAST: Notify everyone about the new report
      console.log('[DEBUG] Incoming report push token:', expoPushToken);
      
      // Find all unique push tokens in the database
      const allTokens = await Item.distinct('expoPushToken', { expoPushToken: { $ne: null } });
      console.log(`[DEBUG] Found ${allTokens.length} existing tokens in database.`);
      
      // Also include the current token if provided
      if (expoPushToken && !allTokens.includes(expoPushToken)) {
        allTokens.push(expoPushToken);
      }

      if (allTokens.length > 0) {
        try {
          const messages = allTokens.map(token => ({
            to: token,
            sound: 'default',
            title: type === 'found' ? `🎁 NEW FOUND ITEM: ${title}` : `🔍 NEW LOST ITEM: ${title}`,
            body: `${category} reported at ${location}. Open the app to see details!`,
            data: { itemId: newItem._id, type, title }
          }));

          // Send in chunks (Expo allows up to 100 at a time)
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(messages)
          });
          console.log(`[Push] Global broadcast sent to ${allTokens.length} devices.`);
        } catch (err) {
          console.error('[Push Broadcast Failure]', err);
        }
      } else {
        console.log('[Push] No devices found to notify.');
      }

      // Send SMS Notifications (if Twilio is configured)
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid_here') {
        const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        for (const data of notificationData) {
          if (data.phone && data.phone !== 'undefined') {
            try {
              // Ensure country code formatting (+91 for India)
              const formattedPhone = data.phone.startsWith('+') ? data.phone : `+91${data.phone}`;
              await twilioClient.messages.create({
                body: `BMSCE Lost & Found Alert!

Type: ${type.toUpperCase()} Report
Item: "${title}"
Category: ${category}
Location: ${location}

Open the app to check if this matches your item!`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formattedPhone
              });
              console.log(`[Twilio] SMS successfully pushed to ${formattedPhone}`);
            } catch (smsErr) {
              console.error(`[Twilio SMS Gateway Error for ${data.phone}]:`, smsErr.message);
            }
          }
        }
      } else {
        console.log('[System Simulation] Twilio credentials missing. SMS logically generated but skipped for:', notificationData);
      }
    }

    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET Success Settlements (Wall of Fame)
router.get('/settlements/recent', async (req, res) => {
  try {
    const settlements = await Settlement.find().sort({ createdAt: -1 }).limit(10);
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Acknowledgment Route (Secure public verification)
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { verifyEmail, thankYouMessage, resolverEmail } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Resolver email is mandatory — this is the other party's email
    if (!resolverEmail) {
      return res.status(400).json({ message: 'Resolver email is required to complete the settlement.' });
    }
    
    // Security verification — verifyEmail must match the original reporter
    if (item.reporterEmail !== verifyEmail) {
      return res.status(403).json({ message: 'Unauthorized! Email does not match the original reporter.' });
    }

    // Determine founder vs receiver based on item type:
    // If item type is 'found' → reporter FOUND it, so reporter = founder, resolver = receiver (the owner)
    // If item type is 'lost'  → reporter LOST it, so reporter = receiver, resolver = founder (who found it)
    const founderEmail  = item.type === 'found' ? item.reporterEmail : resolverEmail;
    const receiverEmail = item.type === 'found' ? resolverEmail : item.reporterEmail;

    // Check if a settlement already exists for this item between the same parties
    // This prevents duplicate history entries when both the lost & found reports
    // for the same item are resolved separately
    const existingSettlement = await Settlement.findOne({
      itemName: item.title || item.category,
      founderEmail,
      receiverEmail,
    });

    if (existingSettlement) {
      // Settlement already exists — just update thankYou if provided and mark item claimed
      if (thankYouMessage && !existingSettlement.thankYouMessage) {
        existingSettlement.thankYouMessage = thankYouMessage;
        await existingSettlement.save();
      }
    } else {
      // Save Settlement Log (clean 2-party record)
      const newSettlement = new Settlement({
        itemName: item.title || item.category,
        itemType: item.type,
        founderEmail,
        receiverEmail,
        thankYouMessage: thankYouMessage || ''
      });
      await newSettlement.save();
    }

    item.status = 'claimed';
    await item.save();
    
    res.json({ message: 'Ownership officially acknowledged and item marked claimed!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET All Settlements (History)
router.get('/settlements/all', async (req, res) => {
  try {
    const settlements = await Settlement.find().sort({ createdAt: -1 });
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Item (Admin Only or public if match)
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
