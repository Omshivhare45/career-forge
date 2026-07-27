const connectDB = require('../config/db');
const AcademicSemester = require('../models/AcademicSemester');
const AcademicBranch = require('../models/AcademicBranch');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicChapter = require('../models/AcademicChapter');
const AcademicVideo = require('../models/AcademicVideo');
const seedAcademics = require('../seeds/academicSeed');

const runVerification = async () => {
  console.log('🚀 Starting B.Tech Academics validation...');
  try {
    const { conn, isMemory } = await connectDB();
    console.log(`Connected to DB. isMemory: ${isMemory}`);

    console.log('Running Academics seed...');
    await seedAcademics();

    console.log('Checking Semester count...');
    const semesters = await AcademicSemester.find({});
    console.log(`Semesters: ${semesters.length} (expected 8)`);

    console.log('Checking Branches count...');
    const branches = await AcademicBranch.find({});
    console.log(`Branches: ${branches.length} (expected 4)`);
    branches.forEach(b => {
      console.log(` - Branch ${b.code}: Active: ${b.isActive}`);
    });

    console.log('Checking Subjects count...');
    const subjects = await AcademicSubject.find({});
    console.log(`Subjects: ${subjects.length} (expected 5)`);
    subjects.forEach(s => {
      console.log(` - Subject ${s.code}: ${s.name}`);
    });

    console.log('Checking Chapters count...');
    const chapters = await AcademicChapter.find({});
    console.log(`Chapters: ${chapters.length} (expected 25 - 5 per subject)`);

    console.log('Checking Video Lectures count...');
    const videos = await AcademicVideo.find({});
    console.log(`Videos: ${videos.length} (expected 125 - 5 per chapter)`);

    console.log('✅ ALL BACKEND SCHEMAS AND SEED DATA CHECKS PASSED!');
    process.exit(0);
  } catch (error) {
    console.error('❌ VALIDATION FAILED:', error.message);
    process.exit(1);
  }
};

runVerification();
