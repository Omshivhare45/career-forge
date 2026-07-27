const mongoose = require('mongoose');

const academicSemesterSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true }, // 1 to 8
  name: { type: String, required: true }, // e.g. "Semester 4"
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('AcademicSemester', academicSemesterSchema);
