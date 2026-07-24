const mongoose = require('mongoose');

const deviceSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  installationId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  deviceName: { type: String, default: 'Generic Device' },
  operatingSystem: { type: String, default: 'Unknown OS' },
  appVersion: { type: String, default: '1.0.0' },
  startTime: { type: Date, default: Date.now, index: true },
  endTime: { type: Date },
  lastSeen: { type: Date, default: Date.now, index: true },
  duration: { type: Number, default: 0 }, // in seconds
  isActive: { type: Boolean, default: true, index: true },
  onlineStatus: { type: String, enum: ['online', 'offline'], default: 'online', index: true }
}, { timestamps: true });

module.exports = mongoose.model('DeviceSession', deviceSessionSchema);
