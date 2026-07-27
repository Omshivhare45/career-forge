const mongoose = require('mongoose');
const AcademicSemester = require('../models/AcademicSemester');
const AcademicBranch = require('../models/AcademicBranch');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicChapter = require('../models/AcademicChapter');
const AcademicVideo = require('../models/AcademicVideo');
const AcademicProgress = require('../models/AcademicProgress');

const seedAcademics = async () => {
  try {
    console.log('🗑️  Clearing existing B.Tech Academics data...');
    await Promise.all([
      AcademicSemester.deleteMany({}),
      AcademicBranch.deleteMany({}),
      AcademicSubject.deleteMany({}),
      AcademicChapter.deleteMany({}),
      AcademicVideo.deleteMany({}),
      AcademicProgress.deleteMany({})
    ]);

    console.log('🌱 Seeding Semesters 1 to 8...');
    const semesters = [];
    for (let i = 1; i <= 8; i++) {
      const sem = await AcademicSemester.create({
        number: i,
        name: `Semester ${i}`,
        isActive: true,
        order: i
      });
      semesters.push(sem);
    }

    console.log('🌱 Seeding Branches (CSE active, others Coming Soon)...');
    const branchesData = [
      { name: 'Computer Science Engineering', code: 'CSE', isActive: true, order: 1 },
      { name: 'Artificial Intelligence & Machine Learning', code: 'AIML', isActive: false, order: 2 },
      { name: 'Cyber Security', code: 'Cyber Security', isActive: false, order: 3 },
      { name: 'Data Science', code: 'Data Science', isActive: false, order: 4 }
    ];
    const branches = {};
    for (const b of branchesData) {
      const branch = await AcademicBranch.create(b);
      branches[b.code] = branch;
    }

    const sem4 = semesters.find(s => s.number === 4);
    const cseBranch = branches['CSE'];

    if (!sem4 || !cseBranch) {
      throw new Error('Semester 4 or CSE branch not found during seeding');
    }

    console.log('🌱 Seeding Semester 4 CSE Subjects (M3, ADA, COA, SE, OS)...');
    const subjectsData = [
      { name: 'Mathematics III', code: 'M3', icon: '📐', description: 'Advanced engineering mathematics, transforms, and probability distributions.', order: 1 },
      { name: 'Analysis & Design of Algorithms', code: 'ADA', icon: '🧠', description: 'Algorithm design techniques, sorting, searching, complexity classes, and graph algorithms.', order: 2 },
      { name: 'Computer Organization & Architecture', code: 'COA', icon: '🖥️', description: 'Basic CPU design, instruction sets, memory hierarchy, cache, and pipeline design.', order: 3 },
      { name: 'Software Engineering', code: 'SE', icon: '🏗️', description: 'Software development lifecycles, requirement analysis, design models, testing, and agile methodologies.', order: 4 },
      { name: 'Operating Systems', code: 'OS', icon: '📀', description: 'Process management, scheduling, memory management, file systems, and concurrency primitives.', order: 5 }
    ];

    const subjects = [];
    for (const s of subjectsData) {
      const subject = await AcademicSubject.create({
        ...s,
        semesterId: sem4._id,
        branchId: cseBranch._id,
        isActive: true
      });
      subjects.push(subject);
    }

    // Standard list of educational YouTube video IDs for a realistic look
    const ytVideoIds = [
      'EAR7De6Goz4', // GFG style fallback
      'Ke90Tje7VS0', // DSA style
      'u8S_cQ82zAM', // OS style
      '0IAPZzGSbME', // CLRS style
      'aFitA8X1518'  // Linked List style
    ];

    console.log('🌱 Seeding Chapters and Video Lectures (5 chapters per subject, 5 videos per chapter)...');
    for (const subject of subjects) {
      for (let chNum = 1; chNum <= 5; chNum++) {
        const chapter = await AcademicChapter.create({
          subjectId: subject._id,
          chapterNumber: chNum,
          name: `Chapter ${chNum}: Fundamentals of ${subject.code} - Part ${chNum}`,
          description: `Detailed study and core concepts of ${subject.name} (Chapter ${chNum}). Covers university syllabus topics and semester exam preparation.`,
          isActive: true,
          order: chNum
        });

        for (let vidNum = 1; vidNum <= 5; vidNum++) {
          const fakeFileId = `TEMP_VIDEO_${subject.code}_C${chNum}_V${vidNum}`;
          await AcademicVideo.create({
            chapterId: chapter._id,
            subjectId: subject._id,
            semesterId: sem4._id,
            branchId: cseBranch._id,
            title: `Lecture ${chNum}.${vidNum}: ${subject.code} Concept Video ${vidNum}`,
            description: `Concept lecture video covering key syllabus elements for Chapter ${chNum} of ${subject.name}.`,
            videoType: 'drive',
            driveLink: `https://drive.google.com/file/d/${fakeFileId}/view`,
            embedLink: `https://drive.google.com/file/d/${fakeFileId}/preview`,
            duration: 600 + (vidNum * 120), // 10 to 18 mins
            notesUrl: 'https://github.com/RidamGupta19/career-forge', // Placeholder notes link
            order: vidNum,
            isPublished: true,
            isActive: true
          });
        }
      }
    }

    console.log('✅ B.Tech Academics successfully seeded!');
  } catch (error) {
    console.error('❌ Error seeding B.Tech Academics:', error.message);
    throw error;
  }
};

module.exports = seedAcademics;
