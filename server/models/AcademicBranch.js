const mongoose = require('mongoose');

const academicBranchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "Computer Science Engineering"
  code: { type: String, required: true, unique: true }, // e.g. "CSE", "AIML"
  isActive: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('AcademicBranch', academicBranchSchema);
