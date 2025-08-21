const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Adding index directly here
  },
  notifications: [
    {
      type: {
        type: String,
        enum: ['message', 'match', 'unmatch', 'reminder'],
        required: true
      },
      title: {
        type: String,
        required: true,
        trim: true
      },
      body: {
        type: String,
        required: true,
        trim: true
      },
      link: {
        type: String,
        default: null
      },
      read: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});


notificationSchema.index({ user: 1, 'notifications.read': 1 });

module.exports = mongoose.model('Notification', notificationSchema);
