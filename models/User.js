
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  username: String,
  email: { type: String, required: true, unique: true },


  googleId: { type: String, default: null },
  age: Number,
   profilePicture: {
    type: String,
    default: '/images/profile.jpg'
  },
 ProfileStatus: {
    type: String,
    enum: ['Public', 'Private'],
    default: 'Private'},
    
 status: {
  type: [
    {
      mediaType: { type: String, enum: ['image', 'video', 'text'], required: true },
      mediaUrl: { type: String },     
      createdAt: { type: Date, default: Date.now }
    }
  ],
  default: []
},
  bio: { type: String, default: '' },
  password: { type: String, default: null }, 
  verified: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
