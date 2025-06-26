const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.render('landingpage'); 
});
router.get('/login', (req, res) => {
  res.render('login');
});

module.exports = router;