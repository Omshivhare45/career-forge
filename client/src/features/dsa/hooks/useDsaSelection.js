import { useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getDsaVideoList, resolveDsaLesson } from '../utils/dsaVideoCatalog';
import { normalizeDsaTutor, readStoredDsaTutor, writeStoredDsaTutor } from '../../../utils/dsaPersonalization';

export function useDsaSelection(topic) {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [preference, setPreference] = useState(readStoredDsaTutor);
  const dsaTutor = normalizeDsaTutor(params.get('track'), preference);
  const topicVideos = useMemo(() => topic ? getDsaVideoList(topic, dsaTutor) : [], [topic, dsaTutor]);
  const activeVideo = resolveDsaLesson(topic, topicVideos, params, dsaTutor);

  const selectDsaTutor = value => {
    const tutor = writeStoredDsaTutor(value);
    setPreference(tutor);
    const next = new URLSearchParams(params);
    next.delete('track');
    const lessons = topic ? getDsaVideoList(topic, tutor) : [];
    if (!resolveDsaLesson(topic, lessons, next, tutor)?.videoId && lessons.some(v => v.videoId)) {
      next.delete('cp');
      next.delete('v');
    }
    if (next.toString() !== params.toString()) setParams(next, { replace: true, state: location.state });
  };
  const setActiveVideoKey = key => {
    const next = new URLSearchParams(params);
    next.delete('cp');
    next.set('track', dsaTutor);
    next.set('v', key);
    setParams(next);
  };
  return { dsaTutor, topicVideos, activeVideo, activeVideoKey: activeVideo?.key, selectDsaTutor, setActiveVideoKey };
}
