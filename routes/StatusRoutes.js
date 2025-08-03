const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();
const { ensureAuth, redirectIfLoggedIn } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { storage } = require('../config/cloudinary');
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 
  }
});


router.get('/status/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).lean();

    if (!user) return res.status(404).send('User not found');

    const now = Date.now();
    const activeStories = (user.status || []).filter(s => (now - new Date(s.createdAt)) < 24 * 60 * 60 * 1000);

    const data = {
      stories: activeStories
    };

    if (user.ProfileStatus === 'Public') {
      data.bio = user.bio || '';
      data.profilePicture = user.profilePicture || '/images/default-profile.png';
      data.age = user.age || 'N/A';
      data.user=user;
      data.partnerId = userId;
    }
    else{
      data.bio = 'This user has a private profile.';
      data.profilePicture = '/images/profile.jpg';
      data.age = user.age || 'N/A';
      data.user=user;
      data.partnerId = userId;

    }

    res.render('status', data);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
router.get('/status', (req, res) => {
  res.status(400).render('statusError', { error: 'Missing user ID.' });
});

module.exports = router;