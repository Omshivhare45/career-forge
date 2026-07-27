const express = require('express');
const router = express.Router();
const c = require('../controllers/academicController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/semesters', c.getSemesters);
router.get('/branches', c.getBranches);
router.get('/subjects', c.getSubjects);
router.get('/chapters', c.getChapters);
router.get('/videos', c.getVideos);
router.get('/progress', c.getProgress);
router.post('/progress', c.updateProgress);

module.exports = router;
