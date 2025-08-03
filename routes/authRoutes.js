const express = require('express');
const User = require('../models/User');
const passport = require('passport');
const { ensureAuth, redirectIfLoggedIn } = require('../middlewares/authMiddleware');
const router = express.Router();


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    if (!req.user.age) {
      return res.render('setup', { username: req.user.username });
    }

    res.redirect('/chat');
  }
);
router.get('/', redirectIfLoggedIn, (req, res) => {
  res.render('landingpage'); 
});

router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('login');
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



router.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(err => {
      if (err) console.error('Session destruction error:', err);
      res.redirect('/');
    });
  });
});

module.exports = router;
