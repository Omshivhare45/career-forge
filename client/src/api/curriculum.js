import api, { hasApiSession } from './axios';
import { publicCurriculum, academicProgress, memberTopics } from './readCache';

const privateAcademic = /^\/academics\/(subjects|chapters|videos)\?/;
const topicDetail = /^\/topics\/[^/]+$/;
function cacheFor(path) {
  if (topicDetail.test(path)) return memberTopics;
  return privateAcademic.test(path) ? academicProgress : publicCurriculum;
}

export const paths = {
  semesters: '/academics/semesters',
  branches: '/academics/branches',
  subjects: (semesterId, branchId) => '/academics/subjects?' + new URLSearchParams({ semesterId, branchId }),
  chapters: subjectId => '/academics/chapters?' + new URLSearchParams({ subjectId }),
  videos: chapterId => '/academics/videos?' + new URLSearchParams({ chapterId }),
  guestTopic: id => '/guest-explore/topics/' + encodeURIComponent(id),
  topic: id => '/topics/' + encodeURIComponent(id),
  phase: id => '/topics/phase/' + encodeURIComponent(id),
  domain: id => '/domains/' + encodeURIComponent(id),
  domainTopics: id => '/topics/domain/' + encodeURIComponent(id),
};

export const peekCurriculum = path => cacheFor(path).peek(path);
export function readCurriculum(path) {
  const cache = cacheFor(path);
  return cache.read(path, () => api.get(path, { skipAuth: cache === publicCurriculum }).then(res => res.data));
}

export function prefetch(path) {
  const connection = navigator.connection;
  if (!path || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType)) return;
  const target = topicDetail.test(path) && !hasApiSession() ? '/guest-explore' + path : path;
  readCurriculum(target).catch(() => {});
}

const dataAt = path => readCurriculum(path).then(result => result.data);
export const getDomains = () => dataAt('/domains');
export const getDomain = id => dataAt(paths.domain(id));
export const getDomainTopics = id => dataAt(paths.domainTopics(id));
export const getDomainDirectory = () => dataAt('/domains?view=directory');
