const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

test('public directory uses only card metadata and a separate cache key', async () => {
  const calls = [];
  const Domain = { find(filter) {
    calls.push(['filter', JSON.parse(JSON.stringify(filter))]);
    return { select(fields) { calls.push(['fields', fields]); return this; }, sort() { return this; }, async lean() { return []; } };
  } };
  const context = { exports: {}, require(name) {
    if (name.includes('curriculumCache')) return { readCurriculum(key, load) { calls.push(['cache', key]); return load(); } };
    if (name.endsWith('/Domain')) return Domain;
    return {};
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controllers/domainController.js'), 'utf8'), context);
  const res = { json(data) { assert.equal(data.success, true); } };
  await context.exports.getDomains({ query: { view: 'directory' } }, res);
  assert.deepEqual(calls, [['cache', 'domain-directory'], ['filter', {}], ['fields', '_id name slug shortDescription icon isActive order']]);
  calls.length = 0;
  await context.exports.getDomains({ query: {} }, res);
  assert.deepEqual(calls, [['cache', 'domains'], ['filter', { isActive: true }]]);
});
