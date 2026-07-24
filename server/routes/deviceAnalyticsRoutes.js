const express = require('express');
const router = express.Router();
const controller = require('../controllers/deviceAnalyticsController');
const { optionalProtect } = require('../middleware/authMiddleware');

router.post('/register', optionalProtect, controller.registerDevice);
router.post('/session/start', optionalProtect, controller.startSession);
router.post('/session/end', optionalProtect, controller.endSession);
router.post('/heartbeat', optionalProtect, controller.sendHeartbeat);

module.exports = router;
