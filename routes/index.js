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

router.get('/', redirectIfLoggedIn, (req, res) => {
  res.render('landingpage'); 
});

router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('login');
});

router.get('/setup', ensureAuth, (req, res) => {
  const user = req.user || req.session.user;
  
  if (user.age) {
    return res.redirect('/chat');
  }

  res.render('setup', { username: user.username });
});
router.post('/setup', ensureAuth, async (req, res) => {
  const { age } = req.body;
  const user = req.user; 

  try {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { age },
      { new: true }
    );

    res.redirect('/chat');
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).send('Error updating profile');
  }
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



router.post('/profile/upload', ensureAuth, upload.single('profilePicture'), async (req, res) => {
  try {
    const imagePath =req.file.path;


    await User.findByIdAndUpdate(req.user._id, {
      profilePicture: imagePath
    });

    res.redirect('/profile');
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Upload failed');
  }
});

router.post('/profile/bio', ensureAuth, async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { bio });

    res.redirect('/profile'); 
  } catch (error) {
    console.error('Error updating bio:', error);
    res.status(500).send('Server error updating bio');
  }
});
router.get('/profile/bio', (req, res) => {
  res.send('Profile bio GET route works!');
});

router.post('/profile/age',ensureAuth,async (req,res)=>{
  try {
    const { age } = req.body;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { age });

    res.redirect('/profile'); 
  } catch (error) {
    res.status(500).send('Server error updating age');
  }
});

router.post('/stories/upload', ensureAuth, upload.single('story'), async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    if (!file) return res.status(400).send('No file uploaded');

    const ext = path.extname(file.originalname).toLowerCase();
    let mediaType = 'image';
    if (['.mp4', '.mov', '.webm', '.avi', '.flv', '.mkv'].includes(ext)) mediaType = 'video';

    const newStory = {
      mediaType,
      mediaUrl: file.path, 
      createdAt: new Date()
    };

    await User.findByIdAndUpdate(userId, { $push: { status: newStory } });

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Upload failed');
  }
});

router.get('/stories/view/:userId', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) return res.status(404).send('User not found');

    const now = new Date();
    const recentStories = (user.status || []).filter(story => {
      return (now - new Date(story.createdAt)) < 24 * 60 * 60 * 1000;
    });

    const showDelete = req.query.from === 'profile';

    res.render('storyViewer', {
      stories: recentStories,
      showDelete
    });
  } catch (err) {
    console.error('Error loading stories:', err);
    res.status(500).send('Failed to load stories');
  }
});

router.post('/stories/delete/:index', ensureAuth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const index = parseInt(req.params.index);

  if (!user || isNaN(index) || index < 0 || index >= user.status.length) {
    return res.status(400).send('Invalid story index');
  }

  user.status.splice(index, 1); 
  await user.save();
  res.redirect('/stories/view/' + user._id);
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
router.post("/profile/visibility", ensureAuth, async (req, res) => {
  const userId = req.session.userId || req.user?._id; 
  try {
    const isPublic = req.body.isPublic;

 
    const status = isPublic ? "Public" : "Private";

    await User.findByIdAndUpdate(userId, { ProfileStatus: status });

    res.json({ success: true, message: `Profile set to ${status.toLowerCase()}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;