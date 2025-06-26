const express = require('express');
const router = express.Router();
const { ensureAuth, redirectIfLoggedIn } = require('../middlewares/authMiddleware');
const User = require('../models/User');

// Public pages — redirect logged-in users to /chat
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
  const user = req.user; // Passport sets this when logged in

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
  res.render('chat', { username: user.username });
});

module.exports = router;
