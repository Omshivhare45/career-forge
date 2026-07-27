const connectDB = require('../config/db');
const AcademicSemester = require('../models/AcademicSemester');
const AcademicBranch = require('../models/AcademicBranch');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicChapter = require('../models/AcademicChapter');
const AcademicVideo = require('../models/AcademicVideo');
const seedAcademics = require('../seeds/academicSeed');

// Replicate parseDriveLink logic for unit testing in script
const parseDriveLink = (link) => {
  if (!link) return { id: '', previewUrl: '' };
  let match = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return { id: match[1], previewUrl: `https://drive.google.com/file/d/${match[1]}/preview` };
  }
  match = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return { id: match[1], previewUrl: `https://drive.google.com/file/d/${match[1]}/preview` };
  }
  match = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return { id: match[1], previewUrl: `https://drive.google.com/file/d/${match[1]}/preview` };
  }
  return { id: '', previewUrl: link };
};

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
    if (semesters.length !== 8) throw new Error('Incorrect semesters count');

    console.log('Checking Branches count...');
    const branches = await AcademicBranch.find({});
    console.log(`Branches: ${branches.length} (expected 4)`);
    branches.forEach(b => {
      console.log(` - Branch ${b.code}: Active: ${b.isActive}`);
    });
    if (branches.length !== 4) throw new Error('Incorrect branches count');

    console.log('Checking Subjects count...');
    const subjects = await AcademicSubject.find({});
    console.log(`Subjects: ${subjects.length} (expected 5)`);
    if (subjects.length !== 5) throw new Error('Incorrect subjects count');

    console.log('Checking Chapters count...');
    const chapters = await AcademicChapter.find({});
    console.log(`Chapters: ${chapters.length} (expected 25 - 5 per subject)`);
    if (chapters.length !== 25) throw new Error('Incorrect chapters count');

    console.log('Checking Video Lectures count...');
    const videos = await AcademicVideo.find({});
    console.log(`Videos: ${videos.length} (expected 125 - 5 per chapter)`);
    if (videos.length !== 125) throw new Error('Incorrect videos count');

    console.log('Verifying Google Drive url parsing unit tests...');
    const testCases = [
      {
        input: 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing',
        expectedId: '1A2B3C4D5E6F7G8H9I0J',
        expectedEmbed: 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/preview'
      },
      {
        input: 'https://drive.google.com/open?id=2X3Y4Z5W6V7U8T9S',
        expectedId: '2X3Y4Z5W6V7U8T9S',
        expectedEmbed: 'https://drive.google.com/file/d/2X3Y4Z5W6V7U8T9S/preview'
      },
      {
        input: 'https://docs.google.com/file/d/9A8B7C6D5E4F/edit',
        expectedId: '9A8B7C6D5E4F',
        expectedEmbed: 'https://drive.google.com/file/d/9A8B7C6D5E4F/preview'
      }
    ];

    testCases.forEach((tc, idx) => {
      const result = parseDriveLink(tc.input);
      console.log(`Test case ${idx + 1}: input="${tc.input}"`);
      console.log(` - Extracted File ID: "${result.id}" (expected: "${tc.expectedId}")`);
      console.log(` - Generated Preview: "${result.previewUrl}" (expected: "${tc.expectedEmbed}")`);
      if (result.id !== tc.expectedId || result.previewUrl !== tc.expectedEmbed) {
        throw new Error(`Google Drive link parsing unit test failed on index ${idx}`);
      }
    });

    console.log('Verifying seeded database Google Drive records consistency...');
    const singleVideo = await AcademicVideo.findOne({ title: /Concept Video 1/ });
    if (!singleVideo) throw new Error('Could not find seeded lecture video');
    console.log(`Found seeded video: "${singleVideo.title}"`);
    console.log(` - driveLink: ${singleVideo.driveLink}`);
    console.log(` - embedLink: ${singleVideo.embedLink}`);
    console.log(` - videoType: ${singleVideo.videoType}`);
    
    if (singleVideo.videoType !== 'drive') {
      throw new Error('Seeded video type is not "drive"');
    }
    if (!singleVideo.driveLink.endsWith('/view') || !singleVideo.embedLink.endsWith('/preview')) {
      throw new Error('Drive link formatting in database is incorrect');
    }

    console.log('✅ ALL GOOGLE DRIVE PARSING & SEED DATA CHECKS PASSED!');
    process.exit(0);
  } catch (error) {
    console.error('❌ VALIDATION FAILED:', error.message);
    process.exit(1);
  }
};

runVerification();
