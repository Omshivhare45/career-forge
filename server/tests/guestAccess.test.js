const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { once } = require('node:events');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');

const secret = 'fixture-signing-secret';
const subjectId = '100000000000000000000001';
const chapterId = '200000000000000000000002';
const videoId = '300000000000000000000003';
const semesterId = '400000000000000000000004';
const branchId = '500000000000000000000005';
const doc = (fields) => ({ ...fields, toObject: () => fields });

function bootFixture() {
  const users = Object.fromEntries(['student', 'admin'].map((role) => [role, {
    _id: role,
    role,
    fullName: 'Fixture ' + role,
    email: role + '@example.test',
    async populate() { return this; },
    generateToken() { return jwt.sign({ id: role }, secret); },
  }]));
  const signedQuery = (value) => ({
    select() { return this; },
    populate() { return this; },
    then(resolve) { resolve(value); },
  });
  const progressReads = [];
  const writes = [];
  const calls = [];
  const subject = doc({ _id: subjectId, isActive: true });
  const chapter = doc({ _id: chapterId, subjectId, isActive: true });
  const published = doc({ _id: videoId, title: 'Published', isPublished: true });
  const draft = doc({ _id: 'draft', title: 'Draft', isPublished: false });
  const ordered = (items) => ({ async sort() { return items; } });
  const models = {
    User: {
      findById(id) { return signedQuery(users[id]); },
      async findOne({ googleId }) { return users[googleId] || null; },
    },
    AcademicSemester: { find: () => ordered([{ _id: semesterId }]) },
    AcademicBranch: { find: () => ordered([{ _id: branchId }]) },
    AcademicSubject: {
      find: () => ordered([subject]), findById: async () => subject,
      exists: async () => true,
    },
    AcademicChapter: {
      find: () => ordered([chapter, doc({ _id: 'second-chapter', subjectId })]),
      findById: async (id) => id === chapterId ? chapter : doc({ isActive: false, subjectId }),
      countDocuments: async () => 1,
      aggregate: async () => [{ _id: subjectId, total: 2 }],
    },
    AcademicVideo: {
      find(filter) { return ordered(filter.isPublished ? [published] : [published, draft]); },
      countDocuments: async () => 1,
      aggregate: async () => [{ _id: chapterId, total: 1, completed: 0 }],
    },
    AcademicProgress: {
      async findOne(filter) {
        progressReads.push(filter);
        return {
          completedChapters: [chapterId], completedVideos: [videoId],
          lastOpenedChapterId: chapterId, lastOpenedVideoId: videoId,
          watchHistory: [{ videoId, watchPercentage: 42, timestamp: 12 }],
        };
      },
      async create(...args) { writes.push(args); },
    },
  };
  const handlers = new Proxy({}, { get: (_target, name) => (req, res) => {
    calls.push({ name, user: req.user?._id });
    res.json({ success: true });
  } });
  const cache = new Map();
  const load = (file) => {
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const sandboxRequire = (id) => {
      if (id.startsWith('../models/')) return models[id.split('/').at(-1)];
      if (id === 'google-auth-library') return { OAuth2Client: class {
        async verifyIdToken({ idToken, audience }) {
          assert.equal(audience, 'fixture-google-client');
          if (idToken !== 'google-student') throw new Error('Invalid fixture credential');
          return { getPayload: () => ({ sub: 'student', email: users.student.email }) };
        }
      } };
      if (id.startsWith('../controllers/') && !/\/(?:academic|auth)Controller$/.test(id)) return handlers;
      if (id.startsWith('.')) return load(resolve(file, '..', id + '.js'));
      return require(id);
    };
    runInNewContext(readFileSync(file, 'utf8'), {
      require: sandboxRequire,
      module,
      exports: module.exports,
      process: { env: { JWT_SECRET: secret, GOOGLE_CLIENT_ID: 'fixture-google-client' } },
    }, { filename: file });
    cache.set(file, module.exports);
    return module.exports;
  };
  const app = express();
  app.use(express.json());
  for (const [path, file] of Object.entries({
    academics: 'academics', code: 'codeRoutes', progress: 'progress',
    submissions: 'submissionRoutes', auth: 'auth', admin: 'admin',
    domains: 'domains', topics: 'topics', certificates: 'certificates',
    ai: 'ai', 'admin/academics': 'adminAcademics',
  })) app.use('/api/' + path, load(resolve(__dirname, '../routes/' + file + '.js')));

  return { app, users, progressReads, writes, calls };
}

test('guest, Google-authenticated student, logout and admin boundaries over HTTP', async (t) => {
  const fixture = bootFixture();
  const server = fixture.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((done) => server.close(done)));
  const base = 'http://127.0.0.1:' + server.address().port + '/api';
  async function request(path, method = 'GET', token, body) {
    const response = await fetch(base + path, {
      method,
      headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  }

  const videosPath = '/academics/videos?chapterId=' + chapterId;
  const chaptersPath = '/academics/chapters?subjectId=' + subjectId;
  const subjectsPath = '/academics/subjects?semesterId=' + semesterId + '&branchId=' + branchId;
  for (const path of ['/domains', '/topics/' + chapterId, '/academics/semesters',
    '/academics/branches', subjectsPath, chaptersPath, videosPath]) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
  }
  for (const token of [undefined, 'invalid-token']) {
    const guest = await request(videosPath, 'GET', token);
    assert.equal(guest.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(guest.body.data.map((video) => [video.title, video.completed, video.timestamp]), [['Published', false, 0]]);
    assert.equal(guest.body.lastOpenedVideoId, null);
    assert.equal(guest.body.chapter._id, chapterId);
  }
  assert.ok((await request(chaptersPath)).body.data.every((chapter) => !chapter.isLocked));
  assert.equal((await request('/academics/videos?chapterId=invalid')).status, 400);
  assert.equal((await request('/academics/videos?chapterId=' + subjectId)).status, 404);
  assert.deepEqual(fixture.progressReads, []);

  for (const [path, method] of [
    ['/progress/dashboard', 'GET'], ['/progress/start-topic', 'POST'],
    ['/progress/complete-topic', 'POST'], ['/progress/video-progress', 'POST'],
    ['/progress/submit-code', 'POST'], ['/submissions/my', 'GET'],
    ['/certificates/my', 'GET'], ['/code/execute', 'POST'], ['/code/judge', 'POST'],
    ['/academics/progress?subjectId=' + subjectId, 'GET'], ['/academics/progress', 'POST'],
    ['/ai/history', 'GET'], ['/auth/me', 'GET'], ['/admin/users', 'GET'],
    ['/admin/academics/video', 'POST'],
  ]) assert.equal((await request(path, method)).status, 401, path);
  assert.deepEqual(fixture.writes, []);

  const login = await request('/auth/google', 'POST', undefined, { token: 'google-student' });
  assert.equal(login.status, 200);
  const token = login.body.token;
  assert.equal(login.body.user.role, 'student');
  assert.equal((await request('/auth/me', 'GET', token)).body.user._id, 'student');
  const signed = await request(videosPath, 'GET', token);
  assert.equal(signed.body.data[0].timestamp, 12);
  assert.equal(signed.body.lastOpenedVideoId, videoId);
  assert.ok(fixture.progressReads.every((query) => query.userId === 'student' && query.subjectId === subjectId));
  assert.equal((await request('/admin/users', 'GET', token)).status, 403);
  assert.equal((await request('/code/execute', 'POST', token)).status, 200);
  assert.equal((await request('/admin/users', 'GET', fixture.users.admin.generateToken())).status, 200);

  // Logout drops the bearer token; the next read returns only public curriculum.
  assert.equal((await request('/auth/me')).status, 401);
  assert.equal((await request(videosPath)).body.lastOpenedVideoId, null);
});
