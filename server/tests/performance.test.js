const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { EventEmitter } = require('node:events');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const { readCurriculum, invalidateCurriculumOnWrite } = require('../services/curriculumCache');

test('public curriculum requests coalesce and only successful writes invalidate the cache', async () => {
  let reads = 0;
  const read = () => readCurriculum('regression', () => ({ version: ++reads }));
  const [first, concurrent] = await Promise.all([read(), read()]);
  assert.deepEqual(first, concurrent);
  assert.equal(reads, 1);

  for (const statusCode of [401, 200]) {
    const res = Object.assign(new EventEmitter(), { statusCode });
    invalidateCurriculumOnWrite({ method: 'PUT' }, res, () => {});
    res.emit('finish');
    assert.equal((await read()).version, statusCode === 200 ? 2 : 1);
  }
  await assert.rejects(readCurriculum('failing', () => { throw new Error('timeout'); }));
  assert.equal(await readCurriculum('failing', () => 'recovered'), 'recovered');
});

test('dashboard summary batches topic lookups, preserves counts, and performs no writes', async () => {
  const filename = resolve(__dirname, '../controllers/progressController.js');
  const module = { exports: {} };
  const selectedTopicIds = [];
  let population;
  const progress = {
    currentPhase: 2,
    overallProgress: 40,
    completedTopics: Array.from({ length: 12 }, (_, i) => ({
      topicId: String(i),
      completedAt: new Date(i),
      notes: 'private note',
    })),
    codeSubmissions: [{ code: 'private draft' }],
  };
  const user = {
    activeDomain: { slug: 'devops', _id: 'devops' },
    domainsProgress: { devops: progress },
    earnedBadges: [],
    dailyStreak: 4,
    activityLog: [],
    async populate(value) { population = value; },
    save() { assert.fail('dashboard reads must never save the user'); },
    toObject() { return this; },
  };
  const models = {
    Topic: {
      find({ _id }) {
        selectedTopicIds.push(Array.from(_id.$in));
        return {
          select() { return this; },
          async lean() { return selectedTopicIds[0].map((_id) => ({ _id, title: 'Topic ' + _id })); },
        };
      },
    },
    Phase: { findOne: () => ({ lean: async () => ({ name: 'Current phase' }) }) },
  };
  runInNewContext(readFileSync(filename, 'utf8'), {
    require(id) { return models[id.split('/').at(-1)] || {}; },
    module, exports: module.exports, console,
  }, { filename });
  const res = {
    set(key, value) { assert.equal(key, 'Cache-Control'); assert.equal(value, 'private, no-store'); },
    status(code) { assert.fail('Unexpected ' + code); },
    json(body) { this.body = JSON.parse(JSON.stringify(body)); },
  };
  await module.exports.getDashboard({ user, query: { view: 'summary' } }, res);
  assert.equal(population.length, 1);
  assert.deepEqual(selectedTopicIds, [['7', '8', '9', '10', '11']]);
  assert.equal(res.body.data.completedTopicsCount, 12);
  assert.equal(res.body.data.recentActivity.length, 5);
  assert.equal(res.body.data.user.domainsProgress.devops.completedTopicsCount, 12);
  assert.doesNotMatch(JSON.stringify(res.body), /private note|private draft/);
});

