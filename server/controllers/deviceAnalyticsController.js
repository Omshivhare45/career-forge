const AppInstallation = require('../models/AppInstallation');
const DeviceSession = require('../models/DeviceSession');
const UserSession = require('../models/UserSession');
const User = require('../models/User');

/**
 * Helper to resolve country, state, city from request headers or fallbacks
 */
const resolveGeoLocation = (req, bodyTimezone) => {
  // Check common reverse proxy headers
  const country = req.headers['cf-ipcountry'] || 
                  req.headers['x-vercel-ip-country'] || 
                  'India'; // Default fallback
                  
  const state = req.headers['cf-region'] || 
                req.headers['x-vercel-ip-country-region'] || 
                'Maharashtra';
                
  const city = req.headers['cf-ipcity'] || 
               req.headers['x-vercel-ip-city'] || 
               'Mumbai';
               
  const timezone = bodyTimezone || 'Asia/Kolkata';

  return { country, state, city, timezone };
};

/**
 * POST /api/device/register
 */
exports.registerDevice = async (req, res) => {
  try {
    const {
      installationId,
      deviceId,
      deviceName,
      deviceModel,
      operatingSystem,
      osVersion,
      browser,
      appVersion,
      installSource,
      timezone
    } = req.body;

    if (!installationId) {
      return res.status(400).json({ success: false, message: 'installationId is required' });
    }

    const { country, state, city, timezone: resolvedTimezone } = resolveGeoLocation(req, timezone);

    // If request contains authorization, assign userId
    const userId = req.user ? req.user._id : undefined;

    let installation = await AppInstallation.findOne({ installationId });

    if (installation) {
      // Update existing record
      installation.lastActiveDate = new Date();
      if (userId) installation.userId = userId;
      if (deviceId) installation.deviceId = deviceId;
      if (deviceName) installation.deviceName = deviceName;
      if (deviceModel) installation.deviceModel = deviceModel;
      if (operatingSystem) installation.operatingSystem = operatingSystem;
      if (osVersion) installation.osVersion = osVersion;
      if (browser) installation.browser = browser;
      if (appVersion) installation.appVersion = appVersion;
      if (installSource) installation.installSource = installSource;
      await installation.save();
    } else {
      // Create new installation
      installation = await AppInstallation.create({
        installationId,
        deviceId: deviceId || installationId,
        userId,
        deviceName: deviceName || 'Web Client',
        deviceModel: deviceModel || 'Browser',
        operatingSystem: operatingSystem || 'Web OS',
        osVersion: osVersion || '1.0',
        browser: browser || 'Unknown Browser',
        appVersion: appVersion || '1.0.0',
        installSource: installSource || 'web',
        country,
        state,
        city,
        timezone: resolvedTimezone,
        installationDate: new Date(),
        firstLaunchDate: new Date(),
        lastActiveDate: new Date()
      });
    }

    res.json({ success: true, data: installation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/device/session/start
 */
exports.startSession = async (req, res) => {
  try {
    const { installationId, sessionId, deviceName, operatingSystem, appVersion } = req.body;

    if (!installationId || !sessionId) {
      return res.status(400).json({ success: false, message: 'installationId and sessionId are required' });
    }

    // Verify installation exists or create a stub
    let installation = await AppInstallation.findOne({ installationId });
    if (!installation) {
      const { country, state, city, timezone } = resolveGeoLocation(req);
      installation = await AppInstallation.create({
        installationId,
        deviceId: installationId,
        userId: req.user ? req.user._id : undefined,
        deviceName: deviceName || 'Web Client',
        operatingSystem: operatingSystem || 'Web OS',
        appVersion: appVersion || '1.0.0',
        country,
        state,
        city,
        timezone
      });
    }

    // Close any previous active sessions for this device to prevent duplicates/leaks
    await DeviceSession.updateMany(
      { installationId, isActive: true, sessionId: { $ne: sessionId } },
      { isActive: false, onlineStatus: 'offline', endTime: new Date() }
    );

    // Create device session
    const deviceSession = await DeviceSession.create({
      sessionId,
      installationId,
      userId: req.user ? req.user._id : undefined,
      deviceName: deviceName || installation.deviceName,
      operatingSystem: operatingSystem || installation.operatingSystem,
      appVersion: appVersion || installation.appVersion,
      startTime: new Date(),
      lastSeen: new Date(),
      isActive: true,
      onlineStatus: 'online'
    });

    // Create user session if authenticated
    if (req.user) {
      await UserSession.create({
        userId: req.user._id,
        sessionId,
        deviceId: installation.deviceId,
        installationId,
        startTime: new Date(),
        lastActive: new Date(),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
        userAgent: req.headers['user-agent'] || ''
      });

      // Update user last active date
      req.user.lastActiveDate = new Date();
      await req.user.save();
    }

    res.json({ success: true, data: deviceSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/device/session/end
 */
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const endTime = new Date();

    // End device session
    const deviceSession = await DeviceSession.findOne({ sessionId, isActive: true });
    if (deviceSession) {
      deviceSession.isActive = false;
      deviceSession.onlineStatus = 'offline';
      deviceSession.endTime = endTime;
      deviceSession.duration = Math.max(0, Math.round((endTime - deviceSession.startTime) / 1000));
      await deviceSession.save();
    }

    // End user session
    const userSession = await UserSession.findOne({ sessionId, endTime: { $exists: false } });
    if (userSession) {
      userSession.endTime = endTime;
      userSession.duration = Math.max(0, Math.round((endTime - userSession.startTime) / 1000));
      await userSession.save();
    }

    res.json({ success: true, message: 'Session ended successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/device/heartbeat
 */
exports.sendHeartbeat = async (req, res) => {
  try {
    const { sessionId, installationId } = req.body;

    if (!sessionId || !installationId) {
      return res.status(400).json({ success: false, message: 'sessionId and installationId are required' });
    }

    // Find device session
    const deviceSession = await DeviceSession.findOne({ sessionId });
    
    // If session is deactivated (e.g. force logout by admin), signal logout
    if (!deviceSession || !deviceSession.isActive) {
      return res.json({ success: true, logoutRequired: true });
    }

    const now = new Date();

    // Update DeviceSession
    deviceSession.lastSeen = now;
    deviceSession.duration = Math.max(0, Math.round((now - deviceSession.startTime) / 1000));
    await deviceSession.save();

    // Update UserSession
    const userSession = await UserSession.findOne({ sessionId });
    if (userSession) {
      userSession.lastActive = now;
      userSession.duration = Math.max(0, Math.round((now - userSession.startTime) / 1000));
      await userSession.save();
    }

    // Update AppInstallation last active date
    await AppInstallation.findOneAndUpdate(
      { installationId },
      { lastActiveDate: now, userId: req.user ? req.user._id : deviceSession.userId }
    );

    // If authenticated, update User's last active date
    if (req.user) {
      req.user.lastActiveDate = now;
      await req.user.save();
    }

    res.json({ success: true, logoutRequired: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
