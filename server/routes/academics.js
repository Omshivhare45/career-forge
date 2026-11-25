const express = require('express');
const router = express.Router();
const c = require('../controllers/academicController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.use((req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});

router.get('/semesters', c.getSemesters);
router.get('/branches', c.getBranches);
router.get('/subjects', optionalProtect, c.getSubjects);
router.get('/chapters', optionalProtect, c.getChapters);
router.get('/videos', optionalProtect, c.getVideos);
router.get('/progress', protect, c.getProgress);
router.post('/progress', protect, c.updateProgress);

module.exports = router;
