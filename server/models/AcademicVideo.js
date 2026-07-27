const mongoose = require('mongoose');

const academicVideoSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicChapter', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSubject' },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSemester' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicBranch' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoType: { type: String, enum: ['drive', 'youtube', 's3', 'cloudinary'], default: 'drive' },
  driveLink: { type: String, default: '' }, // Original link entered by Admin
  embedLink: { type: String, default: '' }, // Auto-generated preview/embed link used in player
  thumbnail: { type: String, default: '' },
  duration: { type: Number, default: 0 }, // in seconds
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true } // keeping isActive for backward compatibility
}, { timestamps: true });

module.exports = mongoose.model('AcademicVideo', academicVideoSchema);
