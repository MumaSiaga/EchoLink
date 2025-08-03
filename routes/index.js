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

router.use('/', require('./authRoutes'));
router.use('/', require('./chatRoutes'));
router.use('/', require('./profileRoutes'));
router.use('/', require('./StatusRoutes'));

module.exports = router;












