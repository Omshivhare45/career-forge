import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiClock, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import SignInPrompt from './SignInPrompt';

const GuestExploreRoadmap = () => {
  const { domainSlug } = useParams();
  const [roadmapState, setRoadmapState] = useState({ slug: null, data: null });
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [signInPrompt, setSignInPrompt] = useState(false);

  useEffect(() => {
    let active = true;

    api.get(`/guest-explore/roadmaps/${encodeURIComponent(domainSlug)}`)
      .then(({ data }) => {
        if (active) setRoadmapState({ slug: domainSlug, data: data.data });
      })
      .catch(() => {
        if (active) {
          setRoadmapState({ slug: domainSlug, data: null });
          toast.error('Could not load this roadmap.');
        }
      });

    return () => {
      active = false;
    };
  }, [domainSlug]);

  const handleSelectPhase = (phase, index) => {
    if (index !== 0) {
      setSignInPrompt(true);
      return;
    }
    setSelectedPhase({ slug: domainSlug, phase });
  };

  const isRoadmapLoaded = roadmapState.slug === domainSlug;
  const roadmap = isRoadmapLoaded ? roadmapState.data : null;

  if (!isRoadmapLoaded) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent" /></div>;
  }

  if (!roadmap) {
    return <main className="mx-auto max-w-4xl px-6 py-16 text-center"><h1 className="text-2xl font-black">Roadmap unavailable</h1><Link to="/" className="mt-5 inline-block font-bold text-[var(--brand-green)]">Return to CareerForge</Link></main>;
  }

  const { domain, phases, freeTopics } = roadmap;
  const selectedFreePhase = selectedPhase?.slug === domainSlug ? selectedPhase.phase : null;
  const isSelectedFreePhase = selectedFreePhase && selectedFreePhase.phaseNumber === phases[0]?.phaseNumber;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-600 transition hover:text-[var(--brand-green)]">
        <FiArrowLeft /> Back to home
      </Link>
      <header className="mb-10 mt-7 rounded-3xl bg-gradient-to-br from-emerald-50 to-sky-50 p-7 sm:p-10">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">{domain.icon}</span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-green)]">Guest roadmap</p>
            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">{domain.name}</h1>
          </div>
        </div>
        <p className="mt-5 max-w-3xl font-semibold leading-relaxed text-slate-600">{domain.shortDescription}</p>
      </header>

      <section aria-labelledby="roadmap-levels-title">
        <div className="mb-5">
          <h2 id="roadmap-levels-title" className="text-2xl font-black text-slate-900">Complete roadmap</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">The first level is open to explore. Sign in to unlock the rest.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {phases.map((phase, index) => {
            const isFree = index === 0;
            const isSelected = selectedFreePhase?._id === phase._id;

            return (
              <button
                key={phase._id}
                type="button"
                onClick={() => handleSelectPhase(phase, index)}
                aria-pressed={isSelected}
                className={`rounded-2xl border-2 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected ? 'border-[var(--brand-green)] bg-emerald-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-600">
                    Level {index + 1}
                  </span>
                  {isFree ? <FiBookOpen className="text-xl text-[var(--brand-green)]" /> : <FiLock className="text-lg text-slate-400" />}
                </div>
                <h3 className="font-black text-slate-900">{phase.name}</h3>
                <p className="mt-2 line-clamp-3 text-sm font-semibold leading-relaxed text-slate-600">{phase.description}</p>
                {phase.estimatedDuration && <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"><FiClock /> {phase.estimatedDuration}</span>}
                <span className={`mt-4 block text-xs font-black uppercase tracking-wider ${isFree ? 'text-[var(--brand-green)]' : 'text-slate-400'}`}>
                  {isFree ? 'Free preview' : 'Sign in to unlock'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {isSelectedFreePhase && (
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="free-level-title">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-green)]">Free level</p>
            <h2 id="free-level-title" className="mt-1 text-2xl font-black text-slate-900">{selectedFreePhase.name}</h2>
            <p className="mt-2 font-semibold leading-relaxed text-slate-600">{selectedFreePhase.description}</p>
          </div>
          {freeTopics.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {freeTopics.map((topic) => (
                <Link
                  key={topic._id}
                  to={`/explore/lesson/${topic._id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-[var(--brand-green)] hover:shadow-md"
                >
                  <span>
                    <span className="block font-black text-slate-900 transition group-hover:text-[var(--brand-green)]">{topic.title}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{topic.estimatedTime || 'Learning material'}</span>
                  </span>
                  <FiBookOpen className="shrink-0 text-xl text-[var(--brand-green)]" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Learning material for this level is coming soon.</p>
          )}
        </section>
      )}

      {signInPrompt && (
        <SignInPrompt
          onClose={() => setSignInPrompt(false)}
          title="Unlock the full roadmap"
          message="Create a free account or sign in to explore this level and continue your learning journey."
        />
      )}
    </main>
  );
};

export default GuestExploreRoadmap;
