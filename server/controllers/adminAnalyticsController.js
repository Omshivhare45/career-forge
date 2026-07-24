const AppInstallation = require('../models/AppInstallation');
const DeviceSession = require('../models/DeviceSession');
const UserSession = require('../models/UserSession');
const User = require('../models/User');
const VersionAnalytics = require('../models/VersionAnalytics');
const analyticsService = require('../services/analyticsService');

/**
 * GET /api/admin/analytics/installations
 */
exports.getInstallationStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    const charts = await analyticsService.getHistoricalCharts();
    res.json({
      success: true,
      data: {
        stats,
        charts: charts.dailyActiveTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/analytics/active-users
 */
exports.getActiveUsersStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    const charts = await analyticsService.getHistoricalCharts();
    res.json({
      success: true,
      data: {
        dau: stats.dau,
        wau: stats.wau,
        mau: stats.mau,
        returningUsers: stats.returningUsers,
        activeUsersTrend: charts.dailyActiveTrend,
        peakUsageHours: charts.peakUsageHours,
        newVsReturning: charts.newVsReturning
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/analytics/devices
 */
exports.getDevicesList = async (req, res) => {
  try {
    const { searchQuery, platform, appVersion, status } = req.query;

    let query = {};

    // Apply filters
    if (platform) {
      query.operatingSystem = new RegExp(platform, 'i');
    }
    if (appVersion) {
      query.appVersion = appVersion;
    }

    if (searchQuery) {
      // Find matching users first if any
      const matchingUsers = await User.find({
        $or: [
          { fullName: new RegExp(searchQuery, 'i') },
          { email: new RegExp(searchQuery, 'i') }
        ]
      }).select('_id');

      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { installationId: new RegExp(searchQuery, 'i') },
        { deviceName: new RegExp(searchQuery, 'i') },
        { operatingSystem: new RegExp(searchQuery, 'i') },
        { browser: new RegExp(searchQuery, 'i') },
        { userId: { $in: userIds } }
      ];
    }

    let installations = await AppInstallation.find(query)
      .populate('userId', 'fullName email role avatar')
      .sort({ lastActiveDate: -1 });

    // Determine online/offline status in-memory based on DeviceSession
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const activeSessions = await DeviceSession.find({
      isActive: true,
      lastSeen: { $gte: oneMinuteAgo }
    }).select('installationId');

    const onlineInstallIds = new Set(activeSessions.map(s => s.installationId));

    let devices = installations.map(inst => {
      const isOnline = onlineInstallIds.has(inst.installationId);
      return {
        ...inst.toObject(),
        isOnline
      };
    });

    if (status === 'online') {
      devices = devices.filter(d => d.isOnline);
    } else if (status === 'offline') {
      devices = devices.filter(d => !d.isOnline);
    }

    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/analytics/platform
 */
exports.getPlatformStats = async (req, res) => {
  try {
    const charts = await analyticsService.getHistoricalCharts();
    res.json({
      success: true,
      data: charts.platformDistribution
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/analytics/versions
 */
exports.getVersionsStats = async (req, res) => {
  try {
    const distribution = await analyticsService.getVersionDistribution();
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/analytics/realtime
 */
exports.getRealtimeStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    
    // Live sessions (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const liveSessions = await DeviceSession.find({
      lastSeen: { $gte: fiveMinutesAgo }
    })
      .populate('userId', 'fullName email avatar')
      .sort({ lastSeen: -1 })
      .limit(10);

    // Live login count (in last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const liveLoginCount = await UserSession.countDocuments({
      startTime: { $gte: oneDayAgo }
    });

    // Recent registrations
    const recentRegistrations = await User.find()
      .select('fullName email createdAt avatar activeDomain')
      .populate('activeDomain', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent installs
    const recentInstalls = await AppInstallation.find()
      .populate('userId', 'fullName email avatar')
      .sort({ installationDate: -1 })
      .limit(5);

    // Recent activity logs (Device Sessions)
    const recentActivity = await DeviceSession.find()
      .populate('userId', 'fullName email avatar')
      .sort({ updatedAt: -1 })
      .limit(8);

    res.json({
      success: true,
      data: {
        currentOnlineUsers: stats.currentOnlineUsers,
        currentActiveDevices: stats.activeDevices,
        liveLoginCount,
        liveSessionCount: stats.totalSessions,
        liveSessions,
        recentRegistrations,
        recentInstalls,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/analytics/devices/:installationId/logout
 */
exports.forceLogoutDevice = async (req, res) => {
  try {
    const { installationId } = req.params;

    // Deactivate all active device sessions for this installationId
    await DeviceSession.updateMany(
      { installationId, isActive: true },
      { isActive: false, onlineStatus: 'offline', endTime: new Date() }
    );

    // Deactivate all active user sessions for this installationId
    await UserSession.updateMany(
      { installationId, endTime: { $exists: false } },
      { endTime: new Date() }
    );

    res.json({ success: true, message: 'Device force logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/analytics/devices/:installationId
 */
exports.removeDevice = async (req, res) => {
  try {
    const { installationId } = req.params;

    // Delete installation record
    await AppInstallation.findOneAndDelete({ installationId });

    // Clean up sessions
    await DeviceSession.deleteMany({ installationId });
    await UserSession.deleteMany({ installationId });

    res.json({ success: true, message: 'Device removed and sessions cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/analytics/users/:userId
 */
exports.getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('activeDomain');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const installation = await AppInstallation.findOne({ userId }).sort({ installationDate: 1 });
    const lastSession = await UserSession.findOne({ userId }).sort({ startTime: -1 });
    const deviceCount = await AppInstallation.countDocuments({ userId });
    
    // Sum session durations
    const timeSpentAgg = await UserSession.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);
    const totalTimeSpent = timeSpentAgg.length > 0 ? timeSpentAgg[0].totalDuration : 0;
    const totalSessions = await DeviceSession.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        installationDate: installation ? installation.installationDate : null,
        registrationDate: user.createdAt,
        lastLogin: lastSession ? lastSession.startTime : null,
        lastActive: user.lastActiveDate || (lastSession ? lastSession.lastActive : null),
        totalSessions,
        totalTimeSpent, // in seconds
        deviceCount,
        appVersion: installation ? installation.appVersion : '1.0.0',
        courseEnrolled: user.activeDomain ? user.activeDomain.name : 'None',
        currentRoadmapLevel: Math.floor((user.totalXP || 0) / 1000) + 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
