const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();
const { ensureAuth, redirectIfLoggedIn } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Chat = require('../models/Chat');
const {cloudinary,storage } = require('../config/cloudinary');
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 
  }
});
const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } 
});


router.post('/profile/upload', ensureAuth, profileUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded');

    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'echolink_uploads', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const result = await streamUpload(req.file.buffer);

    await User.findByIdAndUpdate(req.user._id, {
      profilePicture: result.secure_url,
      profilePicturePublicId: result.public_id
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

router.post('/profile/age',ensureAuth,async (req,res)=>{
  try {
    const { age } = req.body;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { age });

    res.redirect('/profile'); 
  } catch (error) {
    res.status(500).send('Server error updating age');
  }
});
router.post('/stories/upload', ensureAuth, upload.single('story'), async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;
    
    if (!file) return res.status(400).send('No file uploaded');

    const ext = path.extname(file.originalname).toLowerCase();
    let mediaType = 'image';
    if (['.mp4', '.mov', '.webm', '.avi', '.flv', '.mkv'].includes(ext)) mediaType = 'video';
    
    const newStory = {
      mediaType,
      public_id: file.filename, 
      mediaUrl: file.path, 
      createdAt: new Date()
    };
    

    await User.findByIdAndUpdate(userId, { $push: { status: newStory } });

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Upload failed');
  }
});

router.get('/stories/view/:userId', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) return res.status(404).send('User not found');

    const now = new Date();
    const recentStories = (user.status || []).filter(story => {
      return (now - new Date(story.createdAt)) < 24 * 60 * 60 * 1000;
    });
const isOwner = req.user._id.toString() === user._id.toString();

    res.render('storyViewer', {
      userID: user._id,
      stories: recentStories,
      showDelete: isOwner,
    });
  } catch (err) {
    console.error('Error loading stories:', err);
    res.status(500).send('Failed to load stories');
  }
});

router.post('/stories/delete/:id', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const storyId = req.params.id;

    if (!user || !storyId) {
      return res.status(400).send('Invalid story ID or user');
    }

    const story = user.status.find(s => s._id.toString() === storyId);

    if (!story) {
      return res.status(404).send('Story not found');
    }

   
    if (story.public_id) {
      try {
        await cloudinary.uploader.destroy(story.public_id, {
          resource_type: story.mediaType === 'video' ? 'video' : 'image'
        });
      } catch (err) {
        console.error('Cloudinary deletion error:', err);
    
      }
    }

   
    user.status = user.status.filter(s => s._id.toString() !== storyId);
    await user.save();

    res.redirect('/stories/view/' + user._id); 
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
router.post('/profile/remove', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).send('User not found');
    }


    if (user.profilePicturePublicId) {
      try {
        await cloudinary.uploader.destroy(user.profilePicturePublicId);
      } catch (err) {
        console.error('Cloudinary deletion error:', err);
      }
    }

    user.profilePicture = null;
    user.profilePicturePublicId = null;
    await user.save();

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



router.post("/profile/visibility", ensureAuth, async (req, res) => {
  const userId = req.session.userId || req.user?._id; 
  try {
    const isPublic = req.body.isPublic;

 
    const status = isPublic ? "Public" : "Private";

    await User.findByIdAndUpdate(userId, { ProfileStatus: status });

    res.json({ success: true, message: `Profile set to ${status.toLowerCase()}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post('/upload/verify-age', upload.single('file'), async (req, res) => {
  try {
    
    await User.findByIdAndUpdate(req.user._id, {
      verified: 'pending',
      
      verificationImage: req.file.path
    });
   

    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating verification:', error);
    res.status(500).send('Verification upload failed');
  }
});

module.exports = router;