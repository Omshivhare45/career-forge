import api from '../api/axios';

// Helper to generate a unique random ID (similar to UUID)
const generateUUID = () => {
  return 'cf-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
};

// Retrieve or generate persistent IDs
export const getInstallationId = () => {
  let installId = localStorage.getItem('cf_installation_id');
  if (!installId) {
    installId = generateUUID();
    localStorage.setItem('cf_installation_id', installId);
  }
  return installId;
};

export const getDeviceId = () => {
  let deviceId = localStorage.getItem('cf_device_id');
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem('cf_device_id', deviceId);
  }
  return deviceId;
};

// Detect OS
const getOS = () => {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Web OS';
};

// Parse browser name
const getBrowser = () => {
  const ua = navigator.userAgent;
  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr|opera/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return 'Safari';
  if (/firefox|iceweasel/i.test(ua)) return 'Firefox';
  if (/edge|edg/i.test(ua)) return 'Edge';
  if (/opr|opera/i.test(ua)) return 'Opera';
  if (/trident|msie/i.test(ua)) return 'Internet Explorer';
  return 'Other Browser';
};

// Parse OS Version
const getOSVersion = () => {
  const ua = navigator.userAgent;
  let match = ua.match(/(Windows NT|Mac OS X|Android|iPhone OS|iPad OS|OS) ([0-9\._]+)/i);
  if (match) {
    return match[2].replace(/_/g, '.');
  }
  return '1.0';
};

// Extract full device metadata
export const getDeviceMetadata = () => {
  const os = getOS();
  const browser = getBrowser();
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
  return {
    installationId: getInstallationId(),
    deviceId: getDeviceId(),
    deviceName: `${browser} on ${os}`,
    deviceModel: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile/Tablet' : 'Desktop',
    operatingSystem: os,
    osVersion: getOSVersion(),
    browser: browser,
    appVersion: '1.0.0', // Standard version
    installSource: isPWA ? 'pwa' : 'web',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  };
};

let heartbeatInterval = null;
let currentSessionId = null;

/**
 * Registers device installation on backend
 */
export const registerDevice = async () => {
  try {
    const metadata = getDeviceMetadata();
    await api.post('/device/register', metadata);
    localStorage.setItem('cf_device_registered', 'true');
  } catch (error) {
    console.error('Failed to register device analytics:', error);
  }
};

/**
 * Starts a new tracking session
 */
export const startSession = async () => {
  try {
    // Generate new session ID for this instance
    currentSessionId = 'sess-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
    sessionStorage.setItem('cf_session_id', currentSessionId);

    const metadata = getDeviceMetadata();
    await api.post('/device/session/start', {
      installationId: metadata.installationId,
      sessionId: currentSessionId,
      deviceName: metadata.deviceName,
      operatingSystem: metadata.operatingSystem,
      appVersion: metadata.appVersion
    });

    // Start heartbeat polling every 30 seconds
    startHeartbeatPolling();
  } catch (error) {
    console.error('Failed to start device session:', error);
  }
};

/**
 * Ends the active tracking session
 */
export const endSession = async () => {
  try {
    const sessId = currentSessionId || sessionStorage.getItem('cf_session_id');
    if (sessId) {
      stopHeartbeatPolling();
      await api.post('/device/session/end', { sessionId: sessId });
      sessionStorage.removeItem('cf_session_id');
      currentSessionId = null;
    }
  } catch (error) {
    console.error('Failed to end device session:', error);
  }
};

/**
 * Heartbeat sender
 */
const sendHeartbeat = async () => {
  try {
    const sessId = currentSessionId || sessionStorage.getItem('cf_session_id');
    const instId = getInstallationId();

    if (sessId && instId) {
      const response = await api.post('/device/heartbeat', {
        sessionId: sessId,
        installationId: instId
      });

      // Handle Force Logout signal from Admin console
      if (response.data && response.data.logoutRequired) {
        console.warn('⚠️ Force logout received from administration console.');
        stopHeartbeatPolling();
        
        // Clear auth details and force redirect
        localStorage.removeItem('cf_token');
        localStorage.removeItem('cf_user');
        sessionStorage.removeItem('cf_session_id');
        window.location.href = '/login?reason=force_logout';
      }
    }
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
  }
};

const startHeartbeatPolling = () => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  // Send first heartbeat after 5 seconds to verify connection
  setTimeout(() => {
    sendHeartbeat();
  }, 5000);

  // Poll every 30 seconds
  heartbeatInterval = setInterval(sendHeartbeat, 30000);
};

const stopHeartbeatPolling = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};
