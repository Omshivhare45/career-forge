const mongoose = require('mongoose');

const academicVideoSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicChapter', required: true },
  title: { type: String, required: true },
  youtubeId: { type: String, required: true },
  duration: { type: Number, default: 0 }, // seconds
  notesUrl: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('AcademicVideo', academicVideoSchema);
