
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

 
  password: { type: String, default: null }, 

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
