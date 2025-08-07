const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat');

const { getChatHistory } = require('../controllers/chatController');
const { ensureAuth } = require('../middlewares/authMiddleware');

router.get('/', ensureAuth, (req, res) => {
  res.render('chat', { user: req.user });
});
router.get('/chat/history', ensureAuth, getChatHistory);
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

    
    const now = Date.now();
    const stories = (user.status || []).filter(s => (now - new Date(s.createdAt)) < 24 * 60 * 60 * 1000);

    const chat = await Chat.findOne({ participants: user._id, isClosed: false });
    const userId = user._id;
    let partnerId = null;
    if (chat) {
      partnerId = chat.participants.find(p => !p.equals(userId));
    }
    const latestStory = stories.length > 0 ? stories[stories.length - 1] : null;
    res.render('profile', { 
      user: fullUser, 
      partnerId: partnerId ? partnerId.toString() : null,
      stories: stories || [] ,
      latestStory: latestStory || null
    });

  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).send('Error loading profile');
  }
});
router.get('/chat/view/:chatId', ensureAuth, async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.user._id; 

    const chat = await Chat.findById(chatId)
      .populate('participants', 'username profilePicture ProfileStatus')
      .populate('messages.sender', 'username');

    if (!chat) return res.status(404).send('Chat not found');

    const isParticipant = chat.participants.some(p => p._id.toString() === userId.toString());

    if (!isParticipant) return res.status(403).send('Not authorized to view this chat');

    res.render('chatView', {
      chat,
      currentUser: userId
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


module.exports = router;