const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();
const { ensureAuth, redirectIfLoggedIn,redirectIfNotAdmin } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Chat = require('../models/Chat');
const bcrypt = require('bcrypt');
const adminController = require('../controllers/adminController');
const {cloudinary,storage } = require('../config/cloudinary');
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 
  }
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).send('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Incorrect password');

    if (user.role !== 'admin') return res.status(403).send('Access denied: not an admin');

    req.session.user = user;
    res.status(200).send('Login successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
router.get('/admin', redirectIfNotAdmin, async (req, res) => {
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


router.post('/admin/users/:id/verify', redirectIfNotAdmin, adminController.verifyUser);

router.delete('/admin/users/:id', redirectIfNotAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    await Chat.deleteMany({ participants: userId });

    
    await User.updateMany(
      { 'Matches.userId': userId },
      { $pull: { Matches: { userId: userId } } }
    );

    
    await User.findByIdAndDelete(userId);

    res.status(200).send('User and related chats deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

 

router.use('/', require('./notificationRoutes'));
router.use('/', require('./authRoutes'));
router.use('/', require('./chatRoutes'));
router.use('/', require('./profileRoutes'));
router.use('/', require('./StatusRoutes'));

module.exports = router;












