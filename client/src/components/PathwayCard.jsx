import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { roadmapPath } from '../utils/guestNavigation';

// Landing.jsx's pathway icons and border pairings, with the yellow brand accent for data paths.
const pathwayStyles = {
  dsa: ['\u{1F9E0}', 'border-blue-200', 'var(--brand-blue)'],
  'web-development': ['\u{1F310}', 'border-green-200', 'var(--brand-green)'],
  'data-science': ['\u{1F4CA}', 'border-yellow-200', 'var(--brand-yellow)'],
  'data-analytics': [null, 'border-yellow-200', 'var(--brand-yellow)'],
  'ai-ml': [null, 'border-yellow-200', 'var(--brand-yellow)'],
  'cloud-computing': ['\u2601\uFE0F', 'border-orange-200', 'var(--brand-orange)'],
  devops: ['\u2601\uFE0F', 'border-orange-200', 'var(--brand-orange)'],
  'system-design': ['\u{1F3D7}\uFE0F', 'border-yellow-200', 'var(--brand-yellow)'],
  cybersecurity: ['\u{1F6E1}\uFE0F', 'border-red-200', 'var(--error)'],
};

export default function PathwayCard({ domain, selected, progress, selection, onSelect, comingSoon = false }) {
  const [icon, border, accent] = pathwayStyles[domain.slug] || [null, 'border-green-200', 'var(--brand-green)'];
  return (
    <article
      style={{ '--pathway-accent': accent }}
      className={'pathway-card group flex min-w-0 flex-col rounded-3xl border-2 p-5 sm:p-6 ' + border + (comingSoon ? ' pathway-card--upcoming' : '')}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <span aria-hidden="true" className="pathway-icon grid size-14 shrink-0 place-items-center rounded-2xl text-3xl">
          {icon || domain.icon || '\u{1F4DA}'}
        </span>
        {comingSoon && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-800">Coming Soon</span>}
        {!comingSoon && selected && <span className="rounded-full bg-[var(--brand-green-light)] px-2.5 py-1 text-xs font-extrabold text-[var(--brand-green)]">Current path</span>}
      </div>
      <h3 className="mb-2 break-words text-xl font-black leading-tight">{domain.name}</h3>
      <p className="flex-1 text-sm font-bold leading-relaxed text-[var(--land-nav)]">{domain.shortDescription}</p>
      {!comingSoon && progress !== undefined && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-extrabold text-[var(--land-nav)]">{progress}% complete</p>
          <progress aria-label={domain.name + ' progress'} className="block h-1.5 w-full accent-[var(--brand-green)]" value={progress} max="100" />
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[var(--border)] pt-3">
        {comingSoon ? <p className="text-xs font-bold text-[var(--land-nav)]">This track is not open for enrollment yet.</p> : <Link to={roadmapPath(domain._id)} aria-label={'Explore track: ' + domain.name}
          className="pathway-link inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest">
          Explore Track <FiArrowRight strokeWidth={3} />
        </Link>}
        {!comingSoon && onSelect && (
          <button type="button" disabled={Boolean(selection)} onClick={() => onSelect(domain._id)}
            className="pathway-link text-sm font-extrabold underline underline-offset-4 disabled:opacity-50">
            {selection === domain._id ? 'Selecting?' : 'Select path'}
          </button>
        )}
      </div>
    </article>
  );
}
