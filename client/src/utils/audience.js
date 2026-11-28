import api from '../api/axios';

const sent = new Set();
export async function recordAudience(kind) {
  if (sent.has(kind)) return;
  sent.add(kind);
  try {
    let browserId = localStorage.getItem('cf_audience_browser');
    if (!browserId) {
      browserId = crypto.randomUUID();
      localStorage.setItem('cf_audience_browser', browserId);
    }
    await api.post('/device/audience', { browserId, kind });
  } catch {
    sent.delete(kind);
  }
}
