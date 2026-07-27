const mongoose = require('mongoose');

const academicSubjectSchema = new mongoose.Schema({
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSemester', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicBranch', required: true },
  name: { type: String, required: true }, // e.g. "Design and Analysis of Algorithms"
  code: { type: String, required: true }, // e.g. "ADA"
  icon: { type: String, default: '🎓' },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

// A subject code should be unique per semester per branch
academicSubjectSchema.index({ semesterId: 1, branchId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('AcademicSubject', academicSubjectSchema);
