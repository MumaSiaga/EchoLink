const express = require('express');
const passport = require('passport');
const router = express.Router();


const { ensureAuth } = require('../middlewares/authMiddleware');

router.get('/', ensureAuth, (req, res) => {
  res.render('chat', { user: req.user });
});
module.exports = router;