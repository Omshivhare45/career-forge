const express = require('express');
const controller = require('../controllers/guestExploreController');

const router = express.Router();

router.get('/domains', controller.getGuestDomains);
router.get('/roadmaps/:slug', controller.getGuestRoadmap);
router.get('/topics/:topicId', controller.getGuestTopic);

module.exports = router;
