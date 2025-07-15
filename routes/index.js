const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();
const { ensureAuth, redirectIfLoggedIn } = require('../middlewares/authMiddleware');
const User = require('../models/User');

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



router.get('/chat', ensureAuth, (req, res) => {
  const user = req.user || req.session.user;
  console.log('User username:', user.username);
  res.render('chat', { user: req.user || req.session.user });
});
router.get('/profile', ensureAuth, async (req, res) => {
  const user = req.user || req.session.user;

  try {
    const fullUser = await User.findById(user._id).lean();
    res.render('profile', { user: fullUser });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).send('Error loading profile');
  }
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, 
  }
});

router.post('/profile/upload', ensureAuth, upload.single('profilePicture'), async (req, res) => {
  try {
    const imagePath = '/uploads/' + req.file.filename;

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
    if (['.mp4', '.mov', '.webm'].includes(ext)) mediaType = 'video';

    const newStory = {
      mediaType,
      mediaUrl: '/uploads/' + file.filename,
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

    res.render('storyViewer', { stories: recentStories });
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


module.exports = router;