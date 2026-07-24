const mongoose = require('mongoose');

const platformAnalyticsSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, index: true }, // format: YYYY-MM-DD
  totalInstalls: { type: Number, default: 0 },
  activeDevices: { type: Number, default: 0 },
  newInstalls: { type: Number, default: 0 },
  totalRegisteredUsers: { type: Number, default: 0 },
  dau: { type: Number, default: 0 },
  wau: { type: Number, default: 0 },
  mau: { type: Number, default: 0 },
  returningUsers: { type: Number, default: 0 },
  averageSessionDuration: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  currentOnlineUsers: { type: Number, default: 0 },
  platformUsage: {
    android: { type: Number, default: 0 },
    ios: { type: Number, default: 0 },
    web: { type: Number, default: 0 },
    desktop: { type: Number, default: 0 }
  },
  versionDistribution: [{
    version: { type: String },
    count: { type: Number }
  }],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PlatformAnalytics', platformAnalyticsSchema);
