const express = require('express');
const User = require('../models/User');
const passport = require('passport');
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




router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await User.findOne({ email, role: 'admin' });

  if (!admin || admin.password !== password) {
    return res.status(401).send('Invalid credentials');
  }

  req.session.user = admin; 
  res.redirect('/admin/dashboard');
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
