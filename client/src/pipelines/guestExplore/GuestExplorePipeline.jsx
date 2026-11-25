import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { readCurriculum } from '../../api/curriculum';

const DOMAIN_ORDER = ['devops', 'dsa', 'web-development'];

const GuestExplorePipeline = ({ onClose }) => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    readCurriculum('/guest-explore/domains')
      .then(data => {
        if (active) setDomains(data.data || []);
      })
      .catch(() => {
        if (active) {
          setLoadError(true);
          toast.error('Could not load guest roadmaps. Please try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  const orderedDomains = DOMAIN_ORDER
    .map((slug) => domains.find((domain) => domain.slug === slug))
    .filter(Boolean);

  const handleSelectDomain = (slug) => {
    onClose();
    navigate(`/explore/roadmap/${slug}`);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-domain-title"
        className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close domain selection"
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <FiX size={20} />
        </button>
        <div className="mb-7 text-center">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-green)]">Explore as a guest</p>
          <h2 id="guest-domain-title" className="text-3xl font-black text-slate-900">Choose a learning path</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">Preview the complete roadmap and start with its first level.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10" aria-label="Loading domains">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent" />
          </div>
        ) : loadError ? (
          <div className="py-8 text-center">
            <p className="font-semibold text-slate-600">Could not load guest roadmaps. Please try again.</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setLoadError(false);
                setRetryCount((count) => count + 1);
              }}
              className="mt-4 rounded-xl bg-[var(--brand-green)] px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : orderedDomains.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {orderedDomains.map((domain) => (
              <button
                type="button"
                key={domain._id}
                onClick={() => handleSelectDomain(domain.slug)}
                className="group rounded-2xl border-2 border-slate-100 p-5 text-left transition hover:-translate-y-1 hover:border-[var(--brand-green)] hover:shadow-lg"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-2xl">{domain.icon}</span>
                <span className="block font-black text-slate-900">{domain.name}</span>
                <span className="mt-2 block min-h-10 text-xs font-semibold leading-relaxed text-slate-500">{domain.shortDescription}</span>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--brand-green)]">
                  View roadmap <FiArrowRight className="transition group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center font-semibold text-slate-600">Guest roadmaps are temporarily unavailable.</p>
        )}
      </section>
    </div>
  );
};

export default GuestExplorePipeline;
