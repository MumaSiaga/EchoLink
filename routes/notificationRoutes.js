const express = require('express');
const router = express.Router();
const Notification = require('../models/Notifications');
const { ensureAuth } = require('../middlewares/authMiddleware');


router.get('/notifications', ensureAuth, (req, res) => {

    const partnerId = req.user.partnerId;
  res.render('notifications', { partnerId });
});
router.get('/notifications/list', ensureAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.patch('/notifications/:id/read', ensureAuth, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true }
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/notifications', ensureAuth, async (req, res) => {
    try {
        const notif = new Notification({
            user: req.body.user,
            type: req.body.type,
            title: req.body.title,
            body: req.body.body,
            link: req.body.link,
            metadata: req.body.metadata || {}
        });
        await notif.save();

     
        req.io.to(req.body.user.toString()).emit('newNotification', notif);

        res.status(201).json(notif);
    } catch (err) {
        console.error('Error creating notification:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/notifications/:id', ensureAuth, async (req, res) => {
    try {
        await Notification.findOneAndDelete(
            { _id: req.params.id, user: req.user._id }
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/notifications', ensureAuth, async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id });
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting notifications:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
