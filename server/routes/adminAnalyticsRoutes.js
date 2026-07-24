const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminAnalyticsController');
const { protect, authorize } = require('../middleware/auth');

// Secure all routes in this router - require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/installations', controller.getInstallationStats);
router.get('/active-users', controller.getActiveUsersStats);
router.get('/devices', controller.getDevicesList);
router.get('/platform', controller.getPlatformStats);
router.get('/versions', controller.getVersionsStats);
router.get('/realtime', controller.getRealtimeStats);
router.post('/devices/:installationId/logout', controller.forceLogoutDevice);
router.delete('/devices/:installationId', controller.removeDevice);
router.get('/users/:userId', controller.getUserAnalytics);

module.exports = router;
