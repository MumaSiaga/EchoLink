const {cloudinary,storage } = require('../config/cloudinary');
const User = require('../models/User');

exports.verifyUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    if (!user.verificationImage) {
      return res.status(400).send('User does not have a verification image');
    }

    const publicId = user.verificationImage; 

    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

    user.verified = 'true';
    user.verificationImage = null;
    await user.save();

    res.send('User verified and verification image deleted');
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).send('Server error');
  }
};
