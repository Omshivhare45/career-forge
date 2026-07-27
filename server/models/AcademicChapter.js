const mongoose = require('mongoose');

const academicChapterSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSubject', required: true },
  chapterNumber: { type: Number, required: true }, // e.g. 1 to 5
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

academicChapterSchema.index({ subjectId: 1, chapterNumber: 1 }, { unique: true });

module.exports = mongoose.model('AcademicChapter', academicChapterSchema);
