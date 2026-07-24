const AppInstallation = require('../models/AppInstallation');
const DeviceSession = require('../models/DeviceSession');
const UserSession = require('../models/UserSession');
const PlatformAnalytics = require('../models/PlatformAnalytics');
const VersionAnalytics = require('../models/VersionAnalytics');
const User = require('../models/User');

// Simple in-memory cache for dashboard summaries
let cachedStats = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Helper to get the start of today, this week, and this month
 */
const getDateRanges = () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // Sunday
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return { now, startOfToday, startOfWeek, startOfMonth };
};

/**
 * Computes administrative dashboard stats
 */
const getDashboardStats = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedStats && (now - cacheTime < CACHE_TTL)) {
    return cachedStats;
  }

  const { startOfToday, startOfWeek, startOfMonth } = getDateRanges();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const oneMinuteAgo = new Date(now - 60 * 1000);

  // 1. Installs & Devices
  const totalInstalls = await AppInstallation.countDocuments();
  const activeDevices = await AppInstallation.countDocuments({
    lastActiveDate: { $gte: thirtyDaysAgo }
  });
  
  const newInstallsToday = await AppInstallation.countDocuments({
    installationDate: { $gte: startOfToday }
  });
  const newInstallsThisWeek = await AppInstallation.countDocuments({
    installationDate: { $gte: startOfWeek }
  });
  const newInstallsThisMonth = await AppInstallation.countDocuments({
    installationDate: { $gte: startOfMonth }
  });

  // 2. Users
  const totalRegisteredUsers = await User.countDocuments();

  // 3. DAU, WAU, MAU
  const dauResult = await DeviceSession.distinct('installationId', {
    lastSeen: { $gte: oneDayAgo }
  });
  const wauResult = await DeviceSession.distinct('installationId', {
    lastSeen: { $gte: sevenDaysAgo }
  });
  const mauResult = await DeviceSession.distinct('installationId', {
    lastSeen: { $gte: thirtyDaysAgo }
  });

  const dau = dauResult.length;
  const wau = wauResult.length;
  const mau = mauResult.length;

  // 4. Returning Users (active in last 30 days, installed > 24 hours ago)
  const returningUsers = await AppInstallation.countDocuments({
    lastActiveDate: { $gte: thirtyDaysAgo },
    installationDate: { $lt: oneDayAgo }
  });

  // 5. Sessions
  const sessionStats = await DeviceSession.aggregate([
    { $match: { duration: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$duration' },
        totalSessions: { $sum: 1 }
      }
    }
  ]);

  const avgSessionDuration = sessionStats.length > 0 ? Math.round(sessionStats[0].avgDuration) : 0;
  const totalSessions = sessionStats.length > 0 ? sessionStats[0].totalSessions : 0;

  // 6. Online Status
  const currentOnlineUsers = await DeviceSession.countDocuments({
    isActive: true,
    lastSeen: { $gte: oneMinuteAgo }
  });

  const stats = {
    totalInstalls,
    activeDevices,
    newInstallsToday,
    newInstallsThisWeek,
    newInstallsThisMonth,
    totalRegisteredUsers,
    dau,
    wau,
    mau,
    returningUsers,
    avgSessionDuration,
    totalSessions,
    currentOnlineUsers
  };

  // Cache stats
  cachedStats = stats;
  cacheTime = now;

  // Update daily snapshot in PlatformAnalytics asynchronously
  updateDailySnapshot(stats).catch(err => console.error('Error saving platform snapshot:', err));

  return stats;
};

/**
 * Asynchronously logs daily snapshot to PlatformAnalytics
 */
const updateDailySnapshot = async (stats) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Aggregate platforms
  const platformData = await AppInstallation.aggregate([
    {
      $group: {
        _id: {
          $cond: [
            { $regexMatch: { input: "$operatingSystem", regex: /android/i } }, "android",
            { $cond: [
              { $regexMatch: { input: "$operatingSystem", regex: /ios|iphone|ipad/i } }, "ios",
              { $cond: [
                { $regexMatch: { input: "$operatingSystem", regex: /windows|mac|linux|ubuntu/i } }, "desktop",
                "web"
              ]}
            ]}
          ]
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const platformUsage = { android: 0, ios: 0, web: 0, desktop: 0 };
  platformData.forEach(p => {
    if (p._id && platformUsage[p._id] !== undefined) {
      platformUsage[p._id] = p.count;
    } else {
      platformUsage.web += p.count; // fallback
    }
  });

  // Aggregate versions
  const versionData = await AppInstallation.aggregate([
    { $group: { _id: '$appVersion', count: { $sum: 1 } } }
  ]);

  const versionDistribution = [];
  versionData.forEach(v => {
    if (v._id) versionDistribution.push({ version: v._id, count: v.count });
  });

  await PlatformAnalytics.findOneAndUpdate(
    { date: todayStr },
    {
      ...stats,
      platformUsage,
      versionDistribution,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
};

/**
 * Returns historical charts and reports
 */
const getHistoricalCharts = async () => {
  // Get snapshots of last 30 entries (days)
  const snapshots = await PlatformAnalytics.find().sort({ date: 1 }).limit(30);
  
  // If we have fewer than 7 records, let's mock or generate a history backfill to prevent empty charts on first boot
  let chartData = snapshots.map(s => ({
    date: s.date,
    installs: s.newInstalls || 0,
    dau: s.dau || 0,
    wau: s.wau || 0,
    mau: s.mau || 0,
    online: s.currentOnlineUsers || 0,
    sessions: s.totalSessions || 0
  }));

  if (chartData.length === 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    chartData = [{
      date: todayStr,
      installs: 0,
      dau: 0,
      wau: 0,
      mau: 0,
      online: 0,
      sessions: 0
    }];
  }

  // Peak Usage Hours (sessions starting at each hour of the day)
  const peakHoursAgg = await DeviceSession.aggregate([
    {
      $project: {
        hour: { $hour: { date: '$startTime', timezone: 'Asia/Kolkata' } }
      }
    },
    {
      $group: {
        _id: '$hour',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const peakUsageHours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));
  peakHoursAgg.forEach(p => {
    if (p._id !== null && p._id !== undefined && p._id >= 0 && p._id < 24) {
      peakUsageHours[p._id].count = p.count;
    }
  });

  // Platform Distribution
  const platformAgg = await AppInstallation.aggregate([
    {
      $group: {
        _id: {
          $cond: [
            { $regexMatch: { input: "$operatingSystem", regex: /android/i } }, "Android",
            { $cond: [
              { $regexMatch: { input: "$operatingSystem", regex: /ios|iphone|ipad/i } }, "iOS",
              { $cond: [
                { $regexMatch: { input: "$operatingSystem", regex: /windows|mac|linux/i } }, "Desktop",
                "Web"
              ]}
            ]}
          ]
        },
        value: { $sum: 1 }
      }
    }
  ]);

  const platformDistribution = platformAgg.map(p => ({
    name: p._id || 'Web',
    value: p.value
  }));

  // Version Adoption
  const versionAgg = await AppInstallation.aggregate([
    { $group: { _id: '$appVersion', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const totalInstalls = await AppInstallation.countDocuments();
  const versionAdoption = versionAgg.map(v => ({
    version: v._id || '1.0.0',
    count: v.count,
    percentage: totalInstalls > 0 ? Math.round((v.count / totalInstalls) * 100) : 0
  }));

  // New vs Returning users over last 30 days
  const retentionAgg = await PlatformAnalytics.find().sort({ date: -1 }).limit(15);
  const newVsReturning = retentionAgg.reverse().map(r => ({
    date: r.date,
    newUsers: r.newInstalls || 0,
    returningUsers: Math.max(0, (r.dau || 0) - (r.newInstalls || 0))
  }));

  return {
    dailyActiveTrend: chartData,
    peakUsageHours,
    platformDistribution,
    versionAdoption,
    newVsReturning
  };
};

/**
 * Returns version analytics details
 */
const getVersionDistribution = async () => {
  const totalInstalls = await AppInstallation.countDocuments();
  const versionAgg = await AppInstallation.aggregate([
    { $group: { _id: '$appVersion', count: { $sum: 1 } } }
  ]);

  // Find users running latest
  const latestDoc = await VersionAnalytics.findOne({ isLatest: true });
  const latestVersion = latestDoc ? latestDoc.appVersion : '1.0.0';

  let usersRunningLatest = 0;

  const versionsList = versionAgg.map(v => {
    const isLatest = v._id === latestVersion;
    if (isLatest) {
      usersRunningLatest += v.count;
    }
    return {
      version: v._id || 'Unknown',
      count: v.count,
      percentage: totalInstalls > 0 ? Math.round((v.count / totalInstalls) * 100) : 0,
      isLatest
    };
  });

  const latestAdoptionRate = totalInstalls > 0 ? Math.round((usersRunningLatest / totalInstalls) * 100) : 100;

  // If latestAdoptionRate is low (e.g. < 40%) and we have outdated versions, send alert
  const alertOutdated = latestAdoptionRate < 50 && totalInstalls > 5;

  return {
    latestVersion,
    latestAdoptionRate,
    alertOutdated,
    versions: versionsList
  };
};

module.exports = {
  getDashboardStats,
  getHistoricalCharts,
  getVersionDistribution,
  updateDailySnapshot
};
