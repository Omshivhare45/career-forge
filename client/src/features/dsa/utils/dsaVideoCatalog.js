import babbarLectures from './babbarLectures.json' with { type: 'json' };
import { DSA_TUTORS, getTopicTutorKeys, normalizeDsaTutor } from '../../../utils/dsaPersonalization.js';

// Numbered lectures from the repository's yt_videos.json playlist snapshot.
const babbarSections = [
  ['Programming Foundations', 1, 8, 0],
  ['Arrays, Searching & Sorting', 9, 24, 1],
  ['Pointers & Memory', 25, 30, 0],
  ['Recursion', 31, 41, 3],
  ['Object-Oriented Programming', 42, 43, 4],
  ['Linked Lists', 44, 53, 5],
  ['Stacks & Queues', 54, 61, 6],
  ['Binary Trees & BSTs', 62, 73, 7],
  ['Heaps', 74, 77, 11, 'Heaps & Heapify'],
  ['Hashing', 78, 78, 2],
  ['Tries', 79, 81, 11, 'Tries & Implementation'],
  ['Backtracking', 82, 84, 3],
  ['Graphs', 85, 101, 8],
  ['Dynamic Programming', 102, 139, 9],
  ['Greedy Algorithms', 140, 140, 10],
];

// A2Z order for the modules present in CareerForge; retain checkpoint order within each module.
const striverPhaseOrder = [0, 2, 1, 5, 3, 6, 10, 7, 8, 9, 11, 4];

const babbarById = new Map(babbarLectures.map(([id, title]) => [id, title]));
const babbarAnchorTitles = {
  'Start Coding': 0,
  'Arrays Explorer': 1,
  'Hashing Explorer': 2,
  'Recursion Survivor': 3,
  'OOPs Master': 4,
  'Linked List Explorer': 5,
  'Stack & Queue Explorer': 6,
  'Trees Explorer': 7,
  'Graph Explorer': 8,
  'Dynamic Programming Explorer': 9,
  'Greedy Explorer': 10,
  'Heaps & Heapify': 11,
  'Heap Interview Questions': 11,
  'Tries & Implementation': 11,
};

const videoSource = (value) => {
  if (!value) return null;
  if (/^[\w-]{11}$/.test(value)) return { videoId: value, start: 0 };
  try {
    const url = new URL(value);
    const host = url.hostname;
    const videoId = host === 'youtu.be' ? url.pathname.slice(1)
      : ['youtube.com', 'www.youtube.com', 'www.youtube-nocookie.com'].includes(host)
        ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)$/)?.[1]
        : null;
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;
    const time = url.searchParams.get('start') || url.searchParams.get('t') || '0';
    const start = /^\d+s?$/.test(time) ? parseInt(time, 10) : 0;
    return { videoId, start, playlistId: url.searchParams.get('list') };
  } catch {
    return null;
  }
};

const lesson = (tutor, title, source, checkpointId) => ({
  tutor, title, checkpointId,
  type: checkpointId ? 'checkpoint' : 'tutorial',
  key: checkpointId ? 'cp:' + checkpointId : 'video:' + source.videoId,
  ...source,
  embedUrl: source ? 'https://www.youtube.com/embed/' + source.videoId +
    (source.start ? '?start=' + source.start : '') : null,
});

const ownsStriverVideo = (topic, item, source) => {
  const babbarPlaylist = 'PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA';
  if (!source || source.playlistId === babbarPlaylist || babbarById.has(source.videoId)) return false;
  const owners = getTopicTutorKeys(item);
  if (owners.length) return owners.length === 1 && owners[0] === DSA_TUTORS.STRIVER;
  if (topic.title === 'Start Coding') {
    // The seeded cp2 link points to time complexity, not variables and conditions.
    const foundations = { cp1: 'EAR7De6Goz4', cp3: 'tNm_NNSB3_w', cp4: 'RRVYpIET_RU' };
    return foundations[item.id] === source.videoId;
  }
  const topicOwners = getTopicTutorKeys(topic);
  return topicOwners.length === 1 && topicOwners[0] === DSA_TUTORS.STRIVER;
};

const isNumberedBabbarTopic = (topic) =>
  getTopicTutorKeys(topic).includes(DSA_TUTORS.BABBAR) &&
  babbarById.has(videoSource(topic.youtubeLink)?.videoId);

export function getDsaVideoList(topic, tutor = DSA_TUTORS.STRIVER) {
  if (!topic) return [];
  const track = normalizeDsaTutor(tutor);
  const checkpoints = (topic.checkpoints || []).filter((cp, i, list) =>
    cp.id && list.findIndex((entry) => entry.id === cp.id) === i);
  if (track === DSA_TUTORS.BABBAR) {
    if (isNumberedBabbarTopic(topic)) {
      const source = videoSource(topic.youtubeLink);
      return [lesson(track, babbarById.get(source.videoId), source)];
    }
    if (topic.title === 'Heap Interview Questions') {
      return babbarLectures.slice(74, 77).map(([videoId, title]) =>
        lesson(track, title, { videoId, start: 0 }));
    }
    const phase = babbarAnchorTitles[topic.title];
    const sections = babbarSections.filter(([, , , number, anchor]) =>
      number === phase && (!anchor || anchor === topic.title));
    const tutorials = sections.flatMap(([, first, last]) => babbarLectures.slice(first - 1, last)
      .map(([videoId, title], index) => {
        const checkpointId = topic.title === 'OOPs Master' ? checkpoints[index]?.id : undefined;
        return lesson(track, title, { videoId, start: 0 }, checkpointId);
      }));
    return tutorials;
  }
  if (checkpoints.length) {
    // Preserve the lesson order and segment start times supplied by the curriculum.
    return checkpoints.map((cp) => {
      const source = videoSource(cp.youtubeLink);
      return lesson(track, cp.label, ownsStriverVideo(topic, cp, source) ? source : null, cp.id);
    });
  }
  const source = videoSource(topic.youtubeLink);
  return ownsStriverVideo(topic, topic, source) ? [lesson(track, topic.title, source)] : [];
}

export function resolveDsaLesson(topic, lessons, params, tutor) {
  const video = params.get('v');
  const cp = params.get('cp');
  const selected = lessons.find((item) => item.key === video ||
    (video?.startsWith('lib:') && item.videoId === video.slice(4)));
  if (selected) return selected;
  const checkpointId = video?.startsWith('cp:') ? video.slice(3) : cp;
  const checkpoint = topic?.checkpoints?.find((item) => item.id === checkpointId);
  if (checkpoint) {
    return lessons.find((item) => item.checkpointId === checkpointId) ||
      lesson(tutor, checkpoint.label, null, checkpointId);
  }
  return lessons[0] || null;
}

export function getDsaTrackSections(phases, courseTopics, tutor) {
  if (tutor === DSA_TUTORS.STRIVER) {
    const order = new Map(striverPhaseOrder.map((phaseNumber, i) => [phaseNumber, i]));
    const position = (phase) => order.get(phase.phaseNumber) ?? order.size;
    return [...phases].sort((a, b) => position(a) - position(b)).map((phase) => ({
      ...phase,
      topics: (courseTopics[phase._id] || []).filter((topic) => !isNumberedBabbarTopic(topic))
        .map((topic) => ({ ...topic, videos: getDsaVideoList(topic, tutor) })),
    })).filter((phase) => phase.topics.length);
  }
  return babbarSections.flatMap(([name, first, last, phaseNumber, anchor], index) => {
    const phase = phases.find((item) => item.phaseNumber === phaseNumber);
    const topics = courseTopics[phase?._id] || [];
    const numbers = new Map(babbarLectures.slice(first - 1, last).map(([id], i) => [id, i]));
    const sharedTopic = topics.find((topic) => anchor ? topic.title === anchor
      : babbarAnchorTitles[topic.title] === phaseNumber);
    const rows = sharedTopic ? [{
      ...sharedTopic, title: name, videos: getDsaVideoList(sharedTopic, tutor).filter((item) => numbers.has(item.videoId))
    }] : topics.filter(isNumberedBabbarTopic)
      .map((topic) => ({ ...topic, videos: getDsaVideoList(topic, tutor) }))
      .filter((topic) => numbers.has(topic.videos[0]?.videoId))
      .sort((a, b) => numbers.get(a.videos[0].videoId) - numbers.get(b.videos[0].videoId));
    return rows.length ? [{ _id: 'babbar-' + first, name, phaseNumber: index + 1, topics: rows }] : [];
  });
}

export const getDsaTopicPath = (topic, video = topic.videos?.[0]) =>
  '/topic/' + topic._id + (video ? '?v=' + encodeURIComponent(video.key) + '&track=' + encodeURIComponent(video.tutor) : '');

export function getDsaTopicNeighbors(sections, topicId, activeVideo) {
  const topics = sections.flatMap((section) => section.topics);
  const index = topics.findIndex((item) => item._id === topicId &&
    (!activeVideo?.videoId || item.videos.some((video) => video.key === activeVideo.key)));
  const matchingVideo = index < 0 && activeVideo?.videoId
    ? topics.findIndex((item) => item.videos.some((video) => video.videoId === activeVideo.videoId))
    : -1;
  const current = index >= 0 ? index : matchingVideo;
  return {
    previous: current > 0 ? topics[current - 1] : null,
    next: topics[current + 1] || null,
  };
}
