import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import {
  getDsaTopicNeighbors, getDsaTopicPath, getDsaTrackSections, getDsaVideoList, resolveDsaLesson,
} from '../src/features/dsa/utils/dsaVideoCatalog.js';
import {
  readDsaVideoDone, readStoredDsaTutor, writeDsaVideoDone, writeStoredDsaTutor,
} from '../src/utils/dsaPersonalization.js';

const require = createRequire(import.meta.url);
const seed = require('../../server/seeds/topicData.js');
const legacy = require('../../server/seeds/dsaLoveBabbar.js');
const playlist = require('../../yt_videos.json').filter((entry) => /^Lecture \d+:/.test(entry.title));
const phases = [];
const courseTopics = {};
for (const [key, topics] of Object.entries(seed).filter(([name]) => name.startsWith('dsa:'))) {
  phases.push({ _id: key, phaseNumber: Number(key.split(':')[1]) });
  courseTopics[key] = topics.map((topic, index) => ({ ...topic, _id: key + '-' + index }));
}

const topic = (phase, index = 0) => courseTopics['dsa:' + phase][index];
const lectures = (sections) => sections.flatMap((section) => section.topics.flatMap((entry) => entry.videos));
const params = (query = '') => new URLSearchParams(query);
const installStorage = (values = {}) => {
  const data = new Map(Object.entries(values));
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  return data;
};

test('defaults to Striver and restores an explicit track on a new page', () => {
  installStorage({ striver_advanced: 'false' });
  assert.equal(readStoredDsaTutor(), 'striver');
  assert.equal(writeStoredDsaTutor('babbar'), 'babbar');
  assert.equal(readStoredDsaTutor(), 'babbar');
  assert.equal(writeStoredDsaTutor('striver'), 'striver');
  assert.equal(readStoredDsaTutor(), 'striver');
});

test('separates instructor videos for an existing topic without changing its ID', () => {
  const arrays = topic(1);
  const striver = getDsaVideoList(arrays);
  const babbar = getDsaVideoList(arrays, 'babbar');
  assert.equal(striver[0].checkpointId, 'arr_cp1');
  assert.equal(babbar[0].videoId, playlist[8].videoId);
  assert.deepEqual(striver.map((lesson) => lesson.checkpointId), arrays.checkpoints.map((cp) => cp.id));
  assert.ok(striver.every((lesson) => lesson.tutor === 'striver' &&
    !playlist.some((entry) => entry.videoId === lesson.videoId)));
  assert.ok(babbar.every((lesson) => lesson.tutor === 'babbar'));
});

test('keeps the 140 numbered Love Babbar lectures in source sequence without duplication', () => {
  const augmented = Object.fromEntries(Object.entries(courseTopics).map(([key, topics]) => [
    key, [...topics, ...(legacy[key] || []).map((entry) => ({ ...entry, _id: entry.youtubeLink }))],
  ]));
  const sections = getDsaTrackSections(phases, augmented, 'babbar');
  assert.equal(playlist.length, 140);
  assert.deepEqual(lectures(sections).map((lesson) => lesson.videoId), playlist.map((entry) => entry.videoId));
  const oops = getDsaVideoList(topic(4), 'babbar');
  assert.deepEqual(oops.map((entry) => entry.videoId), playlist.slice(41, 43).map((entry) => entry.videoId));
  assert.ok(getDsaVideoList(topic(4), 'striver').every((entry) => entry.embedUrl === null));
});

test('uses track order across topic boundaries and across sections sharing a topic ID', () => {
  const sections = getDsaTrackSections(phases, courseTopics, 'babbar');
  const arrays = sections[1].topics[0];
  const pointers = getDsaTopicNeighbors(sections, arrays._id, arrays.videos[0]).next;
  assert.equal(pointers.title, 'Pointers & Memory');
  assert.equal(pointers._id, topic(0)._id);
  assert.equal(getDsaTopicNeighbors(sections, pointers._id, pointers.videos[0]).previous._id, arrays._id);
  assert.equal(getDsaTopicNeighbors(sections, pointers._id, pointers.videos[0]).next._id, topic(3)._id);
  const striver = getDsaTrackSections(phases, courseTopics, 'striver');
  const linkedList = striver.find((section) => section.phaseNumber === 5).topics[0];
  assert.equal(getDsaTopicNeighbors(striver, linkedList._id, linkedList.videos[0]).next._id, topic(3)._id);
});

test('deep links and refresh select an exact lesson or keep the requested practice checkpoint', () => {
  const arrays = topic(1);
  const striver = getDsaVideoList(arrays, 'striver');
  const babbar = getDsaVideoList(arrays, 'babbar');
  const link = new URL(getDsaTopicPath(arrays, striver[1]), 'http://localhost');
  assert.equal(link.pathname, '/topic/' + arrays._id);
  assert.equal(resolveDsaLesson(arrays, striver, params(link.search), 'striver').videoId, striver[1].videoId);
  const practice = resolveDsaLesson(arrays, babbar, params(link.search), 'babbar');
  assert.equal(practice.checkpointId, striver[1].checkpointId);
  assert.equal(practice.embedUrl, null);
  const oldCheckpoint = resolveDsaLesson(arrays, striver, params('cp=' + striver[1].checkpointId), 'striver');
  assert.deepEqual(oldCheckpoint, striver[1]);
  const oldVideoLink = resolveDsaLesson(arrays, babbar, params('v=lib:' + babbar[2].videoId), 'babbar');
  assert.deepEqual(oldVideoLink, babbar[2]);
  assert.ok(resolveDsaLesson(arrays, striver, params('v=' + babbar[0].key), 'striver').tutor === 'striver');
});

test('shows missing or unowned videos as gaps without losing the shared checkpoint', () => {
  const foundations = getDsaVideoList(topic(0));
  assert.equal(foundations[1].checkpointId, 'cp2');
  assert.equal(foundations[1].embedUrl, null);
  const hashing = getDsaVideoList(topic(2));
  assert.equal(hashing.length, 3);
  assert.equal(new Set(hashing.map((entry) => entry.videoId)).size, 1);
  assert.deepEqual(hashing.map((entry) => entry.start), [0, 850, 1500]);
  assert.ok(getDsaVideoList(topic(11, 3)).every((entry) => entry.embedUrl === null));
  assert.deepEqual(getDsaVideoList({ title: 'Unknown', youtubeLink: playlist[0].videoId }), []);
  assert.deepEqual(getDsaVideoList({ title: 'Spoofed', instructor: 'Striver', youtubeLink: playlist[0].videoId }), []);
});

test('completion is scoped to exact video and segment while existing practice storage stays intact', () => {
  const oops = topic(4);
  const done = getDsaVideoList(oops, 'babbar')[0];
  const practiceKey = 'dsa_cp_done_' + oops._id;
  const ambiguousKey = 'dsa_video_done_' + oops._id + '_' + done.key;
  const data = installStorage({ [practiceKey]: '["oops_cp1"]', [ambiguousKey]: 'true' });
  assert.equal(readDsaVideoDone(oops._id, done), false);
  writeDsaVideoDone(oops._id, done, true);
  assert.equal(readDsaVideoDone(oops._id, done), true);
  assert.equal(readDsaVideoDone(oops._id, { ...done, tutor: 'striver' }), false);
  assert.equal(readDsaVideoDone(oops._id, { ...done, videoId: 'replacement' }), false);
  assert.equal(readDsaVideoDone(oops._id, { ...done, start: 10 }), false);
  assert.equal(readDsaVideoDone('other-topic', done), false);
  assert.equal(data.get(practiceKey), '["oops_cp1"]');
  assert.equal(data.get(ambiguousKey), 'true');
  const oldVerified = getDsaVideoList(topic(1), 'babbar')[0];
  data.set('dsa_video_done_' + topic(1)._id + '_lib:' + oldVerified.videoId, 'true');
  assert.equal(readDsaVideoDone(topic(1)._id, oldVerified), true);
  writeDsaVideoDone(topic(1)._id, oldVerified, false);
  assert.equal(readDsaVideoDone(topic(1)._id, oldVerified), false);
});

