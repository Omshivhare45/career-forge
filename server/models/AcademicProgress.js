const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicVideo', required: true },
  watchPercentage: { type: Number, default: 0, min: 0, max: 100 },
  timestamp: { type: Number, default: 0 }, // last video playback time in seconds
  timeSpent: { type: Number, default: 0 }, // total time spent watching this video in seconds
  completed: { type: Boolean, default: false },
  lastWatchedAt: { type: Date, default: Date.now }
}, { _id: false });

const academicProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSubject', required: true },
  completedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AcademicVideo' }],
  completedChapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AcademicChapter' }],
  
  // Last opened state for "Continue Learning"
  lastOpenedChapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicChapter' },
  lastOpenedVideoId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicVideo' },
  
  watchHistory: [watchHistorySchema]
}, { timestamps: true });

academicProgressSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('AcademicProgress', academicProgressSchema);
