// Completed responses are bounded separately from in-flight reads so eviction
// never starts a second copy of a slow request.
export function createReadCache(maxAge = 300_000, limit = 64) {
  const pending = new Map();
  const values = new Map();

  function peek(key) {
    const entry = values.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expires) {
      values.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function read(key, load) {
    const value = peek(key);
    if (value !== undefined) return Promise.resolve(value);
    if (pending.has(key)) return pending.get(key);
    const request = Promise.resolve().then(load).then(result => {
      if (pending.get(key) === request) {
        if (values.size >= limit) values.delete(values.keys().next().value);
        values.set(key, { value: result, expires: Date.now() + maxAge });
      }
      return result;
    }).finally(() => {
      if (pending.get(key) === request) pending.delete(key);
    });
    pending.set(key, request);
    return request;
  }

  function clear() {
    pending.clear();
    values.clear();
  }

  return { peek, read, clear };
}

export const publicCurriculum = createReadCache();
export const academicProgress = createReadCache(60_000);
export const memberTopics = createReadCache();
