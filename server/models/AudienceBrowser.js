const mongoose = require('mongoose');

// One record per browser, regardless of reloads or concurrent tabs.
const schema = new mongoose.Schema({
  _id: String,
  guest: Boolean,
  viewer: Boolean
}, { versionKey: false });

module.exports = mongoose.model('AudienceBrowser', schema);
