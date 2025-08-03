const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();
const { ensureAuth, redirectIfLoggedIn } = require('../middlewares/authMiddleware');

const { storage } = require('../config/cloudinary');
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 
  }
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await User.findOne({ email, role: 'admin' });

  if (!admin || admin.password !== password) {
    return res.status(401).send('Invalid credentials');
  }

  req.session.user = admin; 
  res.redirect('/admin/dashboard');
});
router.post('/Admin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).send('User not found');

    if (user.password !== password) {
      return res.status(400).send('Incorrect password');
    }

    if (user.role !== 'admin') {
      return res.status(403).send('Access denied: not an admin');
    }

    res.status(200).send('Login successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
router.get('/Admin',redirectIfLoggedIn, async (req, res) => {
  const users = await User.find({ role: 'user' });
  res.render('Admin', { users });
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

router.use('/', require('./authRoutes'));
router.use('/', require('./chatRoutes'));
router.use('/', require('./profileRoutes'));
router.use('/', require('./StatusRoutes'));

module.exports = router;












