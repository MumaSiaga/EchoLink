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


router.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(err => {
      if (err) console.error('Session destruction error:', err);
      res.redirect('/');
    });
  });
});

module.exports = router;
