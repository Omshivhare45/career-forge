import api from './axios';

const requests = new Map();
const maxAge = 5_000;
function publicRead(path) {
  const now = Date.now();
  const cached = requests.get(path);
  if (cached && cached.expires > now) return cached.request;
  requests.delete(path);
  if (requests.size >= 24) requests.delete(requests.keys().next().value);
  const entry = { expires: Infinity };
  entry.request = api.get(path, { skipAuth: true }).then(({ data }) => {
    entry.expires = Date.now() + maxAge;
    return data.data;
  }).catch((error) => {
    if (requests.get(path) === entry) requests.delete(path);
    throw error;
  });
  requests.set(path, entry);
  return entry.request;
}
export const getDomains = () => publicRead('/domains');
export const getDomain = (id) => publicRead('/domains/' + encodeURIComponent(id));
export const getDomainTopics = (id) => publicRead('/topics/domain/' + encodeURIComponent(id));

export const getDomainDirectory = () => publicRead('/domains?view=directory');
