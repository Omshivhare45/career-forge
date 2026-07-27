const express = require('express');
const router = express.Router();
const c = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

// Semesters
router.post('/semester', c.createSemester);
router.put('/semester/:id', c.updateSemester);
router.delete('/semester/:id', c.deleteSemester);

// Branches
router.post('/branch', c.createBranch);
router.put('/branch/:id', c.updateBranch);
router.delete('/branch/:id', c.deleteBranch);

// Subjects
router.post('/subject', c.createSubject);
router.put('/subject/:id', c.updateSubject);
router.delete('/subject/:id', c.deleteSubject);

// Chapters
router.post('/chapter', c.createChapter);
router.put('/chapter/:id', c.updateChapter);
router.delete('/chapter/:id', c.deleteChapter);

// Videos
router.post('/video', c.createVideo);
router.put('/video/:id', c.updateVideo);
router.delete('/video/:id', c.deleteVideo);

module.exports = router;
