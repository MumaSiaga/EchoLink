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
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

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
module.exports = router;
