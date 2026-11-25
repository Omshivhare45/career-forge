import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowRight, FiAward, FiBookOpen, FiCode, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getDomainDirectory } from '../api/curriculum';
import api from '../api/axios';
import { partitionDomains } from '../utils/domainAvailability';
import PathwayCard from '../components/PathwayCard';
import './dashboardPathways.css';
import { roadmapPath, validatedReturnPath } from '../utils/guestNavigation';

const domainProgressKey = (slug) =>
  ({ 'web-development': 'webdev', 'open-source': 'opensource' })[slug] || slug;

function ProgressBar({ value }) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  return <progress aria-label="Learning progress" className="h-2 w-full accent-[var(--primary)]" value={percent} max="100" />;
}

function DashboardContent({ user, refreshUser }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [domains, setDomains] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [domainsFailed, setDomainsFailed] = useState(false);
  const [selection, setSelection] = useState(null);
  const [domainReload, setDomainReload] = useState(0);

  useEffect(() => {
    let active = true;
    getDomainDirectory().then((items) => { if (active) { setDomains(items); setDomainsFailed(false); } })
      .catch(() => { if (active) setDomainsFailed(true); });
    return () => { active = false; };
  }, [domainReload]);

  const userId = user?._id;
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    api.get('/progress/dashboard', { params: { view: 'summary' }, signal: controller.signal })
      .then(({ data }) => setSummary(data.data))
      .catch(() => { if (!controller.signal.aborted) setSummaryFailed(true); });
    return () => controller.abort();
  }, [userId]);

  const account = summary?.user || user;
  const activeDomain = account?.activeDomain || account?.selectedDomain;
  const activeDomainId = activeDomain?._id || activeDomain;
  const progress = (slug) => account?.domainsProgress?.[domainProgressKey(slug)] || {};
  const activeProgress = progress(activeDomain?.slug);
  const lastTopic = activeProgress.lastOpenedTopic?._id || activeProgress.lastOpenedTopic;
  const activeDomainName = activeDomain?.name || domains?.find((item) => item._id === activeDomainId)?.name;
  const recent = summary?.recentActivity?.slice().reverse() || [];
  const overall = account?.domainsProgress
    ? Object.values(account.domainsProgress).filter((item) => item.completedTopicsCount || item.completedTopics?.length || item.overallProgress)
    : [];
  const overallProgress = overall.length
    ? Math.round(overall.reduce((sum, item) => sum + (item.overallProgress || 0), 0) / overall.length)
    : 0;

  const { available, upcoming } = partitionDomains(domains || []);

  const selectDomain = async (domainId) => {
    if (selection) return;
    setSelection(domainId);
    const next = validatedReturnPath(params.get('next'), user?.role);
    try {
      if (domainId !== activeDomainId) await api.post('/progress/select-domain', { domainId });
      const fresh = await refreshUser();
      if (fresh?.profile?.isProfileComplete) {
        navigate(next || roadmapPath(domainId));
      } else {
        navigate(next ? '/setup-profile?' + new URLSearchParams({ next }) : '/setup-profile');
      }
    } catch {
      toast.error('Could not select this learning domain.');
    } finally {
      setSelection(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-7 sm:px-7 lg:py-9">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--land-text)]">
            {user ? 'Welcome back, ' + (user.fullName?.split(' ')[0] || 'learner') : 'Explore CareerForge'}
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
            {user ? 'Pick up where you left off or explore another learning domain.' : 'Browse lectures and practice problems as a guest. Sign in to save progress and run code.'}
          </p>
        </div>
        <Link to="/ide" className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-green)] px-4 py-2.5 text-sm font-extrabold text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--brand-green-hover)]"><FiCode /> Code Editor</Link>
      </header>

      {user && (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <section className="card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-lg font-black"><FiBookOpen className="text-[var(--primary)]" /> Continue Learning</h2>
            {activeDomainId ? <>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{activeDomainName || 'Your active domain'} {summary?.currentPhaseData?.name && '? ' + summary.currentPhaseData.name}</p>
              <ProgressBar value={activeProgress.overallProgress} />
              <Link to={lastTopic ? '/topic/' + encodeURIComponent(lastTopic) : roadmapPath(activeDomainId)}
                className="mt-3 inline-flex items-center gap-2 font-black text-[var(--primary)]">Continue <FiArrowRight /></Link>
            </> : <p className="mt-2 text-sm text-[var(--text-muted)]">Choose a domain to start your learning path.</p>}
          </section>
          <section className="card p-4 sm:p-5">
            <h2 className="text-lg font-black">Your Progress</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div><FiZap className="text-[var(--warning)]" /><strong>{account?.totalXP ?? account?.xp ?? 0}</strong><br />XP</div>
              <div><FiZap className="text-[var(--secondary)]" /><strong>{account?.dailyStreak ?? 0}</strong><br />Day streak</div>
              <div><FiAward className="text-[var(--primary)]" /><strong>{summary?.totalBadges ?? user.earnedBadges?.length ?? 0}</strong><br />Badges</div>
            </div>
            <p className="mt-3 text-xs font-bold text-[var(--text-muted)]">Overall progress ? {overallProgress}%</p>
            <ProgressBar value={overallProgress} />
          </section>
        </div>
      )}

      <section id="domains" aria-labelledby="learning-domains" className="pathway-section">
        <div className="mb-6 border-b border-[var(--border)] pb-5 text-center">
          <h2 id="learning-domains" className="text-3xl font-black text-[var(--land-text)] sm:text-4xl">
            Choose Your <span className="text-[var(--brand-green)]">Pathway</span>
          </h2>
          <p className="mt-2 text-sm font-bold text-[var(--land-nav)]">Choose an available track, follow its roadmap, and practice as you learn.</p>
          {user && <Link to="/career-guide" className="pathway-link mt-2 inline-block text-sm font-extrabold">Career guide</Link>}
        </div>
        {domainsFailed ? <p role="status">Domains are unavailable. <button className="pathway-link underline" type="button" onClick={() => setDomainReload((count) => count + 1)}>Try again</button></p>
          : domains === null ? <div role="status" aria-label="Loading domains" className="pathway-grid">{[0, 1, 2].map((key) => <div key={key} className="h-52 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--land-bg)] motion-reduce:animate-none" />)}</div>
          : domains.length === 0 ? <p className="text-sm text-[var(--land-nav)]">No learning domains are available yet.</p>
          : <div className="pathway-grid">
            {available.map((domain) => {
              const selected = domain._id === activeDomainId;
              return <PathwayCard key={domain._id} domain={domain} selected={selected}
                progress={user ? Number(progress(domain.slug).overallProgress) || 0 : undefined}
                selection={selection} onSelect={user && (!selected || params.has("next")) ? selectDomain : undefined} />;
            })}
          </div>}
      </section>

      {!domainsFailed && domains !== null && <section className="pathway-section" aria-labelledby="upcoming-domains">
        {!available.length && <p className="mb-6 text-sm text-[var(--land-nav)]">No tracks are available right now. Please check back soon.</p>}
        {upcoming.length > 0 && <>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="upcoming-domains" className="text-2xl font-black">Coming Soon</h2>
              <p className="mt-1 text-sm font-semibold text-[var(--land-nav)]">More pathways to explore as they become available.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">More ways to grow</span>
          </div>
          <div className="pathway-grid">{upcoming.map((domain) => <PathwayCard key={domain._id} domain={domain} comingSoon />)}</div>
        </>}
      </section>}

      {user && <section className="card p-4 sm:p-5">
        <h2 className="text-lg font-black">Learning Activity</h2>
        {recent.length ? <ul className="mt-2 divide-y divide-[var(--border)]">
          {recent.map((item, index) => <li key={String(item.topicId?._id || index) + index} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            {item.topicId ? <Link className="font-bold text-[var(--primary)]" to={'/topic/' + item.topicId._id}>{item.topicId.title}</Link> : <span>Completed topic</span>}
            {item.completedAt && <time className="text-[var(--text-muted)]" dateTime={item.completedAt}>{new Date(item.completedAt).toLocaleDateString()}</time>}
          </li>)}
        </ul> : <p className="mt-2 text-sm text-[var(--text-muted)]">{summaryFailed ? 'Learning activity is unavailable.' : summary ? 'Completed lessons will appear here.' : 'Loading recent activity?'}</p>}
      </section>}
    </div>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  return <DashboardContent key={user?._id || 'guest'} user={user} refreshUser={refreshUser} />;
}
