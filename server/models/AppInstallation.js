const mongoose = require('mongoose');

const appInstallationSchema = new mongoose.Schema({
  installationId: { type: String, required: true, unique: true, index: true },
  deviceId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  deviceName: { type: String, default: 'Generic Device' },
  deviceModel: { type: String, default: 'Generic Model' },
  operatingSystem: { type: String, default: 'Unknown OS', index: true },
  osVersion: { type: String, default: 'Unknown OS Version' },
  browser: { type: String, default: 'Unknown Browser', index: true },
  appVersion: { type: String, default: '1.0.0', index: true },
  installationDate: { type: Date, default: Date.now, index: true },
  firstLaunchDate: { type: Date, default: Date.now },
  lastActiveDate: { type: Date, default: Date.now, index: true },
  installSource: { type: String, default: 'web', index: true }, // e.g. pwa, web, google-play, apple-store
  country: { type: String, default: 'Unknown', index: true },
  state: { type: String, default: 'Unknown' },
  city: { type: String, default: 'Unknown' },
  timezone: { type: String, default: 'UTC' }
}, { timestamps: true });

module.exports = mongoose.model('AppInstallation', appInstallationSchema);
