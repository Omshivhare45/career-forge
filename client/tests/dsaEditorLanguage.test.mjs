import test from 'node:test';
import assert from 'node:assert/strict';
import { getTopicEditorLanguage } from '../src/features/dsa/utils/editorLanguage.js';
import { normalizeDsaLanguage } from '../src/utils/dsaPersonalization.js';
const dsa = { domainId: { slug: 'dsa' }, title: 'Start Coding' };

test('DSA restores programming languages and repairs legacy HTML/CSS preferences', () => {
  for (const language of ['cpp', 'java', 'python', 'javascript']) assert.equal(getTopicEditorLanguage(dsa, language), language);
  for (const language of ['html', 'css', '', null, undefined, 'invalid']) assert.equal(getTopicEditorLanguage(dsa, language), 'cpp');
  assert.equal(normalizeDsaLanguage('js'), 'javascript');
});
test('web lessons retain HTML/CSS while returning to DSA restores its preference', () => {
  const preference = 'python';
  assert.equal(getTopicEditorLanguage({ domainId: { slug: 'web-development' }, title: 'HTML Basics' }, preference), 'html');
  assert.equal(getTopicEditorLanguage({ domainId: 'web-development', title: 'CSS Layout' }, preference), 'css');
  assert.equal(getTopicEditorLanguage(dsa, preference), 'python');
  assert.equal(getTopicEditorLanguage({ domainId: 'dsa', title: 'Arrays' }, preference), 'python');
});
test('unrelated domains do not receive a forced web or DSA language', () => {
  assert.equal(getTopicEditorLanguage({ domainId: { slug: 'data-science' } }, 'cpp'), null);
});
