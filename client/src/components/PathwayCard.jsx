import { getDomain, getDomainTopics } from '../api/curriculum';
import { getDsaTrackSections, getDsaTopicPath } from '../features/dsa/utils/dsaVideoCatalog';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { DSA_TUTOR_OPTIONS, writeStoredDsaTutor } from '../utils/dsaPersonalization';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiActivity, FiBarChart2, FiBox, FiCheck, FiCheckCircle, FiCloud,
  FiCpu, FiDatabase, FiGitBranch, FiGrid, FiLayers, FiLink, FiLock,
  FiMonitor, FiPenTool, FiShield, FiSmartphone,
} from 'react-icons/fi';
import { roadmapPath } from '../utils/guestNavigation';

const domainCovers = {
  dsa: '/images/domain_dsa.png',
  'web-development': '/images/domain_webdev.png',
};

const domainSymbols = {
  dsa: FiGitBranch,
  'web-development': FiMonitor,
  'data-science': FiActivity,
  'data-analytics': FiBarChart2,
  'cloud-computing': FiCloud,
  devops: FiLayers,
  'system-design': FiGrid,
  cybersecurity: FiShield,
  'app-development': FiSmartphone,
  'ai-ml': FiCpu,
  blockchain: FiLink,
  'ui-ux': FiPenTool,
  'database-administration': FiDatabase,
  'qa-testing': FiCheckCircle,
};

function DomainArt({ domain, compact }) {
  const cover = compact ? null : domainCovers[domain.slug];
  const Symbol = domainSymbols[domain.slug];
  return (
    <div className="pathway-card__stage" aria-hidden="true">
      <div className="pathway-scroll-art">
        {cover
          ? <img className="pathway-card__illustration" src={cover} width="1024" height="1024" alt="" decoding="async" />
          : <span className="pathway-card__emblem">{Symbol ? <Symbol /> : domain.icon || <FiBox />}</span>}
      </div>
    </div>
  );
}

export default function PathwayCard({ domain, selected, progress, selection, onSelect, comingSoon = false }) {
  const [choice, setChoice] = useState(null);
  const navigate = useNavigate();
  const isDsa = domain.slug === 'dsa';
  const [opening, setOpening] = useState(false);
  async function chooseTutor(key) {
    if (opening) return;
    setOpening(true);
    try {
      const [course, topics] = await Promise.all([getDomain(domain._id), getDomainTopics(domain._id)]);
      const grouped = {};
      for (const topic of topics) (grouped[topic.phaseId?._id || topic.phaseId] ||= []).push(topic);
      const lessons = getDsaTrackSections(course.phases, grouped, key)
        .flatMap(section => section.topics.flatMap(topic => topic.videos.filter(video => video.embedUrl).map(video => ({ topic, video }))));
      const entry = (key === 'babbar' && lessons.find(({ video }) => video.videoId === 't6zLJOCVqD0')) || lessons[0];
      if (!entry) { toast.error('No playable lessons are available for this track.'); return; }
      const destination = getDsaTopicPath(entry.topic, entry.video);
      writeStoredDsaTutor(key);
      if (choice === 'select') await onSelect(domain._id, destination);
      else navigate(destination);
      setChoice(null);
    } catch {
      toast.error('Could not open the track. Please try again.');
    } finally { setOpening(false); }
  }
  return (
    <article className={'pathway-card' + (comingSoon ? ' pathway-card--upcoming' : '')}>
      <DomainArt domain={domain} compact={comingSoon} />
      {comingSoon && <span className="pathway-card__status"><FiLock aria-hidden="true" />Coming soon</span>}
      <div className="pathway-card__body">
        {!comingSoon && selected && <span className="pathway-card__status"><FiCheck aria-hidden="true" />Current path</span>}
        <h3>{domain.name}</h3>
        <p className="pathway-card__description">{domain.shortDescription}</p>
        {!comingSoon && progress !== undefined && (
          <div className="pathway-card__progress">
            <span>{progress}% complete</span>
            <progress aria-label={domain.name + ' progress'} value={progress} max="100" />
          </div>
        )}
        {comingSoon ? (
          <p className="pathway-card__notice">This track is not open for enrollment yet.</p>
        ) : (
          choice ? <div className="pathway-card__actions" role="group" aria-label="Choose your DSA instructor">
            <strong style={{ width: '100%' }}>Choose your instructor</strong>
            {DSA_TUTOR_OPTIONS.map(tutor => <button key={tutor.key} disabled={opening} type="button" className="pathway-card__explore" onClick={() => chooseTutor(tutor.key)}>{tutor.label}</button>)}
            <button type="button" className="pathway-card__select" disabled={opening} onClick={() => setChoice(null)}>Cancel</button>
          </div> : <div className="pathway-card__actions">
            {isDsa ? <button type="button" className="pathway-card__explore" onClick={() => setChoice('explore')}>Explore track</button> : <Link to={roadmapPath(domain._id)} aria-label={'Explore track: ' + domain.name} className="pathway-card__explore">
              Explore track
            </Link>}
            {onSelect && (
              <button type="button" disabled={Boolean(selection)} onClick={() => isDsa ? setChoice('select') : onSelect(domain._id)} className="pathway-card__select">
                {selection === domain._id ? 'Selecting…' : 'Select path'}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
