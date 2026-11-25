import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadCache } from '../src/api/readCache.js';

test('a prefetch and a foreground read share one pending request even during eviction', async () => {
  const cache = createReadCache(5_000, 1);
  const slow = Promise.withResolvers();
  let loads = 0;
  const load = () => { loads++; return slow.promise; };
  const first = cache.read('subject', load);
  await cache.read('other', () => 1);
  assert.equal(cache.read('subject', load), first);
  slow.resolve('chapters');
  assert.equal(await first, 'chapters');
  assert.equal(cache.peek('subject'), 'chapters');
  assert.equal(cache.peek('other'), undefined);
  assert.equal(loads, 1);
});

test('responses from before invalidation cannot replace the current account response', async () => {
  const cache = createReadCache();
  const old = Promise.withResolvers();
  const beforeLogout = cache.read('chapter', () => old.promise);
  cache.clear();
  assert.equal(await cache.read('chapter', () => 'guest preview'), 'guest preview');
  old.resolve('student progress');
  await beforeLogout;
  assert.equal(cache.peek('chapter'), 'guest preview');
});

test('expired and failed reads can be retried', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1 });
  const cache = createReadCache(100);
  await assert.rejects(cache.read('roadmap', () => Promise.reject(new Error('offline'))));
  await cache.read('roadmap', () => 'first');
  t.mock.timers.tick(100);
  assert.equal(cache.peek('roadmap'), undefined);
  assert.equal(await cache.read('roadmap', () => 'updated'), 'updated');
});
