const mongoose = require('mongoose');

const versionAnalyticsSchema = new mongoose.Schema({
  appVersion: { type: String, required: true, unique: true, index: true },
  totalInstalls: { type: Number, default: 0 },
  activeUsers: { type: Number, default: 0 },
  updateRate: { type: Number, default: 0 }, // percentage of users on this version
  isLatest: { type: Boolean, default: false },
  lastChecked: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('VersionAnalytics', versionAnalyticsSchema);
