const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, unique: true, index: true },
  deviceId: { type: String },
  installationId: { type: String, index: true },
  startTime: { type: Date, default: Date.now, index: true },
  endTime: { type: Date },
  lastActive: { type: Date, default: Date.now, index: true },
  duration: { type: Number, default: 0 }, // in seconds
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('UserSession', userSessionSchema);
