import axios from 'axios';
import { academicProgress, memberTopics, publicCurriculum } from './readCache';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Use Vite's proxy in development; local preview uses the backend directly.
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.startsWith('192.168.')
  );

  if (isLocal && import.meta.env.DEV) {
    return '/api';
  }

  return isLocal
    ? `http://${window.location.hostname}:5000`
    : 'https://careerforge-nkf0.onrender.com';
};

const rawApiUrl = getBaseURL();
const baseURL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

console.log('🔌 Axios API baseURL:', baseURL);

const api = axios.create({ baseURL });

let sessionToken = null;

export const hasApiSession = () => Boolean(sessionToken);

export const setApiSessionToken = (token) => {
  if (sessionToken !== token) {
    academicProgress.clear();
    memberTopics.clear();
  }
  sessionToken = token;
};

api.interceptors.request.use((config) => {
  if (!config.skipAuth && sessionToken && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", "Bearer " + sessionToken);
  }
  return config;
});

api.interceptors.response.use(response => {
  const { method, url } = response.config;
  if (method !== 'get' && method !== 'head') {
    if (url === '/academics/progress' || url.startsWith('/admin/academics/')) academicProgress.clear();
    if (/^\/(admin\/academics|topics|domains|phases|badges|assessments)(\/|$)/.test(url)) {
      publicCurriculum.clear();
      memberTopics.clear();
    }
  }
  return response;
});

export default api;
