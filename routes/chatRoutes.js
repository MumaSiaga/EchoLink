const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat');


const { ensureAuth } = require('../middlewares/authMiddleware');

router.get('/', ensureAuth, (req, res) => {
  res.render('chat', { user: req.user });
});

router.get('/chat', ensureAuth, async (req, res) => {
  const user = req.user || req.session.user;
   const chat = await Chat.findOne({ participants: user._id,isClosed: false});
    const userId = user._id;
    let partnerId = null;
    if (chat) {
      partnerId = chat.participants.find(p => !p.equals(userId));
    }
  console.log('User username:', user.username);
  res.render('chat', { user: req.user || req.session.user, partnerId: partnerId ? partnerId.toString() : null });
});
router.get('/profile', ensureAuth, async (req, res) => {
  const user = req.user || req.session.user;

  try {
    const fullUser = await User.findById(user._id).lean();
      const chat = await Chat.findOne({ participants: user._id,isClosed: false});
    const userId = user._id;
    let partnerId = null;
    if (chat) {
      partnerId = chat.participants.find(p => !p.equals(userId));
    }
  res.render('profile', { user: fullUser , partnerId: partnerId ? partnerId.toString() : null });
 
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).send('Error loading profile');
  }
});

module.exports = router;