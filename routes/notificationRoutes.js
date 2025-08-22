const express = require('express');
const router = express.Router();
const Notification = require('../models/Notifications');
const { ensureAuth } = require('../middlewares/authMiddleware');
const Chat = require('../models/Chat');

router.get('/notifications', ensureAuth, async (req, res) => {
   const chat = await Chat.findOne({ participants: req.user._id, isClosed: false });
   const userId = req.user._id;
   let partnerId = null;
   if (chat) {
     partnerId = chat.participants.find(p => !p.equals(userId));
   }
   res.render('notifications', { partnerId, user: req.user });
});

router.get('/notifications/list', ensureAuth, async (req, res) => {
  try {
    const notifDoc = await Notification.findOne({ user: req.user._id }).lean();
    const notifications = notifDoc ? notifDoc.notifications.sort((a, b) => b.createdAt - a.createdAt) : [];
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/notifications/:notifId/read', ensureAuth, async (req, res) => {
  try {
    await Notification.updateOne(
      { user: req.user._id, 'notifications._id': req.params.notifId },
      { $set: { 'notifications.$.read': true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/notifications', ensureAuth, async (req, res) => {
  try {
    let notifDoc = await Notification.findOne({ user: req.body.user });
    if (!notifDoc) {
      notifDoc = new Notification({ user: req.body.user, notifications: [] });
    }

    notifDoc.notifications.push({
      type: req.body.type,
      title: req.body.title,
      body: req.body.body,
      link: req.body.link,
      read: false,
      createdAt: new Date()
    });

    await notifDoc.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/notifications/:notifId', ensureAuth, async (req, res) => {
  try {
    await Notification.updateOne(
      { user: req.user._id },
      { $pull: { notifications: { _id: req.params.notifId } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/notifications', ensureAuth, async (req, res) => {
  try {
    await Notification.updateOne(
      { user: req.user._id },
      { $set: { notifications: [] } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
