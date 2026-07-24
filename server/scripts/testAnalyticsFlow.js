const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const AppInstallation = require('../models/AppInstallation');
const DeviceSession = require('../models/DeviceSession');
const UserSession = require('../models/UserSession');
const PlatformAnalytics = require('../models/PlatformAnalytics');
const VersionAnalytics = require('../models/VersionAnalytics');

const { registerDevice, startSession, sendHeartbeat, endSession } = require('../controllers/deviceAnalyticsController');
const { getDashboardStats } = require('../services/analyticsService');

// Mock Express response object helper
const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

const runTest = async () => {
  console.log('🧪 Starting App Installation & Analytics System Flow Test...\n');
  
  // 0. Connect DB
  const { isMemory } = await connectDB();
  console.log('📡 Connected to MongoDB.');

  const installationId = 'test-install-999';
  const sessionId = 'test-session-999';
  const testEmail = 'test-analytics-student@careerforge.com';

  try {
    // Clean up any stale test records
    await AppInstallation.deleteMany({ installationId });
    await DeviceSession.deleteMany({ sessionId });
    await UserSession.deleteMany({ sessionId });
    await User.deleteOne({ email: testEmail });

    // 1. New user installs PWA / Device registers
    console.log('\n--- Step 1 & 2: Device Installation Registration ---');
    const regReq = {
      body: {
        installationId,
        deviceId: 'test-device-uuid',
        deviceName: 'Test Chrome on Windows',
        deviceModel: 'Desktop',
        operatingSystem: 'Windows',
        osVersion: '11.0',
        browser: 'Chrome',
        appVersion: '1.0.0',
        installSource: 'pwa',
        timezone: 'Asia/Kolkata'
      },
      headers: {},
      ip: '127.0.0.1'
    };
    const regRes = mockResponse();
    await registerDevice(regReq, regRes);
    
    console.log('Response Status:', regRes.statusCode || 200);
    console.log('Device Registered in DB:', regRes.jsonData.success);
    
    const instCount = await AppInstallation.countDocuments({ installationId });
    console.log('AppInstallation Count in DB:', instCount);
    if (instCount !== 1) throw new Error('Installation was not recorded correctly.');

    // 2. User registers
    console.log('\n--- Step 3: User Registers ---');
    const newUser = await User.create({
      fullName: 'Analytics Test Student',
      email: testEmail,
      role: 'student',
      provider: 'local',
      password: 'password123',
      profile: {
        collegeName: 'Test Academy',
        branch: 'Computer Science',
        year: 3,
        isProfileComplete: true
      }
    });
    console.log('User created in DB with ID:', newUser._id);

    // 3. User logs in & Session starts
    console.log('\n--- Step 4 & 5: Session Starts ---');
    const sessionReq = {
      body: {
        installationId,
        sessionId,
        deviceName: 'Test Chrome on Windows',
        operatingSystem: 'Windows',
        appVersion: '1.0.0'
      },
      user: newUser,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      ip: '127.0.0.1'
    };
    const sessionRes = mockResponse();
    await startSession(sessionReq, sessionRes);
    
    console.log('Response Status:', sessionRes.statusCode || 200);
    console.log('Session Started in DB:', sessionRes.jsonData.success);
    
    const activeDevSession = await DeviceSession.findOne({ sessionId });
    const activeUserSession = await UserSession.findOne({ sessionId });
    
    console.log('DeviceSession found:', !!activeDevSession);
    console.log('UserSession found:', !!activeUserSession);
    
    if (!activeDevSession || !activeUserSession) {
      throw new Error('Device or User Session was not created.');
    }
    if (activeDevSession.onlineStatus !== 'online') {
      throw new Error('Device onlineStatus should be "online"');
    }

    // 4. User becomes active / Send heartbeats
    console.log('\n--- Step 6: User Heartbeat (Active Status) ---');
    // Simulate some active time passing
    activeDevSession.startTime = new Date(Date.now() - 45000); // 45 seconds ago
    await activeDevSession.save();
    if (activeUserSession) {
      activeUserSession.startTime = new Date(Date.now() - 45000);
      await activeUserSession.save();
    }

    const hbReq = {
      body: {
        sessionId,
        installationId
      },
      user: newUser
    };
    const hbRes = mockResponse();
    await sendHeartbeat(hbReq, hbRes);
    
    console.log('Response Status:', hbRes.statusCode || 200);
    console.log('Logout Required Flag:', hbRes.jsonData.logoutRequired);

    const updatedDevSession = await DeviceSession.findOne({ sessionId });
    console.log('Updated Duration (seconds):', updatedDevSession.duration);
    if (updatedDevSession.duration < 40) {
      throw new Error('Heartbeat did not update the session duration correctly.');
    }

    // 5. Dashboard updates / Check stats
    console.log('\n--- Step 7: Dashboard Updates ---');
    const stats = await getDashboardStats(true); // force recalculation
    console.log('Stats - Total Installs:', stats.totalInstalls);
    console.log('Stats - Current Online Users:', stats.currentOnlineUsers);
    console.log('Stats - Daily Active Users (DAU):', stats.dau);
    
    if (stats.totalInstalls < 1 || stats.currentOnlineUsers < 1) {
      throw new Error('Dashboard stats were not updated correctly.');
    }

    // 6. User logs out / Session ends
    console.log('\n--- Step 8 & 9: User Logs Out / Session Ends ---');
    const logoutReq = {
      body: { sessionId }
    };
    const logoutRes = mockResponse();
    await endSession(logoutReq, logoutRes);
    
    console.log('Response Status:', logoutRes.statusCode || 200);
    console.log('Session Ended in DB:', logoutRes.jsonData.success);

    const closedDevSession = await DeviceSession.findOne({ sessionId });
    const closedUserSession = await UserSession.findOne({ sessionId });
    
    console.log('DeviceSession isActive:', closedDevSession.isActive);
    console.log('DeviceSession onlineStatus:', closedDevSession.onlineStatus);
    console.log('UserSession endTime recorded:', !!closedUserSession.endTime);

    if (closedDevSession.isActive || closedDevSession.onlineStatus !== 'offline') {
      throw new Error('Session was not deactivated correctly.');
    }

    // 7. Verify stats final state
    console.log('\n--- Step 10: Final Stats Verification ---');
    const finalStats = await getDashboardStats(true);
    console.log('Final Stats - Current Online Users:', finalStats.currentOnlineUsers);
    
    console.log('\n✅ All steps completed successfully! Flow matches constraints.');
  } catch (err) {
    console.error('\n❌ Test Flow Failed:', err.message);
  } finally {
    // Cleanup test records
    console.log('\n🧹 Cleaning up test database records...');
    await AppInstallation.deleteMany({ installationId });
    await DeviceSession.deleteMany({ sessionId });
    await UserSession.deleteMany({ sessionId });
    await User.deleteOne({ email: testEmail });
    await PlatformAnalytics.deleteMany({ date: new Date().toISOString().split('T')[0] });
    console.log('🧹 Cleanup complete.');
    
    // Close DB connection
    await mongoose.connection.close();
    console.log('🔌 DB connection closed. Test process exiting.');
  }
};

runTest();
