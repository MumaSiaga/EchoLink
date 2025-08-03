const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  event: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed 
});

module.exports = mongoose.model('Analytics', analyticsSchema);

