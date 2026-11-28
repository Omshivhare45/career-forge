const express = require('express');
const router = express.Router();
const controller = require('../controllers/deviceAnalyticsController');
const { optionalProtect } = require('../middleware/authMiddleware');

const AudienceBrowser = require('../models/AudienceBrowser');

router.post('/audience', optionalProtect, async (req, res, next) => {
  const { browserId, kind } = req.body || {};
  if (!['guest', 'viewer'].includes(kind) || typeof browserId !== 'string' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(browserId)) {
    return res.sendStatus(400);
  }
  if (kind === 'guest' && req.user) return res.sendStatus(204);
  try {
    await AudienceBrowser.updateOne({ _id: browserId.toLowerCase() }, { $set: { [kind]: true } }, { upsert: true });
    res.sendStatus(204);
  } catch (error) { next(error); }
});

router.post('/register', optionalProtect, controller.registerDevice);
router.post('/session/start', optionalProtect, controller.startSession);
router.post('/session/end', optionalProtect, controller.endSession);
router.post('/heartbeat', optionalProtect, controller.sendHeartbeat);

module.exports = router;
