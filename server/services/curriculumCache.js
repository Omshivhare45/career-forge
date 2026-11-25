const entries = new Map();
const ttl = 30_000;
const capacity = 64;

function readCurriculum(key, load) {
  const now = Date.now();
  const cached = entries.get(key);
  if (cached && cached.expiresAt > now) return cached.value;
  entries.delete(key);
  if (entries.size >= capacity) entries.delete(entries.keys().next().value);
  const entry = { expiresAt: now + ttl };
  entry.value = Promise.resolve().then(load).catch((error) => {
    if (entries.get(key) === entry) entries.delete(key);
    throw error;
  });
  entries.set(key, entry);
  return entry.value;
}

function invalidateCurriculumOnWrite(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.once('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) entries.clear();
    });
  }
  next();
}

module.exports = { readCurriculum, invalidateCurriculumOnWrite };
