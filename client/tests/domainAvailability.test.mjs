import test from 'node:test';
import assert from 'node:assert/strict';
import { isDomainAvailable, partitionDomains } from '../src/utils/domainAvailability.js';

test('launch lineup includes DSA and web development only', () => {
  for (const slug of ['dsa', 'web-development']) assert.equal(isDomainAvailable({ _id: slug, slug, isActive: true }), true);
  for (const slug of ['data-science', 'devops', 'cloud-computing', 'new-domain']) assert.equal(isDomainAvailable({ _id: slug, slug, isActive: true }), false);
});
test('inactive and missing domains never become available', () => {
  assert.equal(isDomainAvailable({ _id: 'dsa', slug: 'dsa', isActive: false }), false);
  assert.equal(isDomainAvailable(null), false);
  assert.equal(isDomainAvailable({ slug: 'dsa' }), false);
});
test('partition preserves IDs, source order and existing progress without mutation', () => {
  const domains = [{ _id: 'original-data-id', slug: 'data-science', progress: 42 }, { _id: 'original-dsa-id', slug: 'dsa' }, { _id: 'original-web-id', slug: 'web-development' }];
  const before = JSON.stringify(domains);
  const { available, upcoming } = partitionDomains(domains);
  assert.deepEqual(available.map((d) => d._id), ['original-dsa-id', 'original-web-id']);
  assert.equal(upcoming[0], domains[0]);
  assert.equal(upcoming[0].progress, 42);
  assert.equal(JSON.stringify(domains), before);
});
