import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { FiMenu, FiChevronRight, FiCheckCircle, FiPlay, FiZap, FiBookOpen } from 'react-icons/fi';
import WorkspaceSidebar from './WorkspaceSidebar';
import { VideoPlayer } from './VideoPlayer';
import ProblemSection from './ProblemSection';
import { CodeWorkspace } from './CodeWorkspace';
import { TopicNavigation } from './TopicNavigation';
import { CelebrationOverlay } from './CelebrationOverlay';
import { SubmissionModal } from './SubmissionModal';
import RecursionVisualizer from '../../../components/RecursionVisualizer';

// Unified DSA learning workspace.
// One contiguous page: accordion sidebar (phases → topics → videos) + a stable
// main area (title/progress header → video strip → video/lesson → editor).
//   ctx truthy  → deep-linked topic workspace (/topic/:id), fully interactive.
//   ctx null    → read-only roadmap workspace (/roadmap) that deep-links into
//                 /topic/:id when a topic is opened.
export const DSAWorkspacePage = ({ ctx }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [courseTopics, setCourseTopics] = useState({});
  const [courseLoading, setCourseLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setSidebarOpen((prev) => window.innerWidth >= 1024 ? true : prev);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const domainId = user?.selectedDomain?._id || user?.selectedDomain;

  useEffect(() => {
    if (!domainId) return;
    let cancelled = false;
    api.get(`/domains/${domainId}`)
      .then((res) => {
        if (cancelled || !res.data?.data) return;
        setCourse(res.data.data);
        const phases = res.data.data.phases || [];
        const phaseIds = phases.map((p) => p._id);
        return Promise.all(phaseIds.map((pid) => api.get(`/topics/phase/${pid}`))).then((results) => {
          if (cancelled) return;
          const map = {};
          phaseIds.forEach((pid, idx) => {
            map[pid] = results[idx]?.data?.data || [];
          });
          setCourseTopics(map);
        });
      })
      .catch(() => {/* roadmap shell handles errors */}
      )
      .finally(() => {
        if (!cancelled) setCourseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [domainId]);

  const activeTopicId = ctx?.id || null;
  const activeTopic = ctx?.topic || null;
  const topicVideos = ctx?.topicVideos || [];
  const activeVideo = ctx?.activeVideo || null;
  const activeVideoKey = ctx?.activeVideoKey || null;

  const completedTopicIds = useMemo(() => {
    const list = ctx?.activeDomainProgress?.completedTopics || user?.domainsProgress?.dsa?.completedTopics || [];
    return list.map((t) => t.topicId?._id || t.topicId).filter(Boolean);
  }, [ctx, user]);

  const doneVideos = topicVideos.filter((v) => {
    try {
      return localStorage.getItem(`dsa_video_done_${activeTopicId}_${v.key}`) === 'true';
    } catch {
      return false;
    }
  }).length;

  const handleSelectTopic = (topicId) => {
    if (topicId === activeTopicId) {
      setSidebarOpen(isMobile ? true : sidebarOpen);
      return;
    }
    navigate(`/topic/${topicId}`);
  };

  const handleSelectVideo = (topicId, videoKey) => {
    if (ctx && topicId === ctx.id) {
      ctx.setActiveVideoKey(videoKey);
    } else {
      navigate(`/topic/${topicId}?v=${videoKey}`);
    }
  };

  const handleNextTopic = () => {
    if (ctx?.nextTopic) navigate(`/topic/${ctx.nextTopic._id}`);
    else if (ctx?.prevTopic) navigate(`/topic/${ctx.prevTopic._id}`);
    else navigate('/roadmap');
  };

  const isCheckpointVideo = activeVideo?.type === 'checkpoint';
  const cpContent = ctx?.activeCheckpointContent || null;

  return (
    <div className="flex h-[calc(100svh-64px)] w-full overflow-hidden bg-[var(--bg-main)] relative">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <WorkspaceSidebar
        course={course}
        courseTopics={courseTopics}
        activeTopicId={activeTopicId}
        activeVideoKey={activeVideoKey}
        completedTopicIds={completedTopicIds}
        onSelectTopic={handleSelectTopic}
        onSelectVideo={handleSelectVideo}
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sidebar toggle (shown when collapsed) */}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-[var(--bg-card)] border border-[var(--border)] rounded-r-xl p-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            aria-label="Open roadmap sidebar"
          >
            <FiChevronRight size={18} />
          </button>
        )}

        {courseLoading && !ctx ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : !activeTopic || !ctx ? (
          /* ─── Empty / select-a-topic state ─── */
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto px-6 py-14 text-center">
              <div className="w-16 h-16 mx-auto bg-[var(--primary-light)] text-[var(--primary)] rounded-2xl flex items-center justify-center text-3xl shadow-inner mb-5">🗺️</div>
              <h1 className="text-2xl font-black text-[var(--text-main)] dark:text-[var(--text-main)] tracking-tight">Welcome to the DSA Learning Workspace</h1>
              <p className="text-[var(--text-muted)] text-sm font-semibold mt-3 leading-relaxed">
                Pick any topic from the roadmap on the left to start. Every topic bundles all its
                video lectures, lesson notes and a code editor in one stable workspace — no more
                juggling between the roadmap and separate topic pages.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
                <div className="card p-4 rounded-2xl space-y-2">
                  <div className="w-9 h-9 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl flex items-center justify-center"><FiPlay /></div>
                  <div className="text-xs font-black text-[var(--text-main)]">Many videos per topic</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-semibold leading-relaxed">Watch every lecture for a topic without leaving the page.</div>
                </div>
                <div className="card p-4 rounded-2xl space-y-2">
                  <div className="w-9 h-9 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl flex items-center justify-center"><FiBookOpen /></div>
                  <div className="text-xs font-black text-[var(--text-main)]">Lesson + editor</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-semibold leading-relaxed">Problem, constraints, hints and one code editor — side by side.</div>
                </div>
                <div className="card p-4 rounded-2xl space-y-2">
                  <div className="w-9 h-9 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl flex items-center justify-center"><FiZap /></div>
                  <div className="text-xs font-black text-[var(--text-main)]">Progress tracked</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-semibold leading-relaxed">Video + topic progress persists as you learn.</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ─── STABLE HEADER ─── */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border)] px-4 lg:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                  aria-label="Open menu"
                >
                  <FiMenu size={16} />
                </button>
              )}

              <div className="min-w-0">
                <div className="text-[8px] font-black text-[var(--primary)] uppercase tracking-widest">
                  Level {typeof activeTopic.phaseId === 'object' ? (activeTopic.phaseId?.phaseNumber ?? 0) : '0'} · {activeTopic.isCheckpointModule ? 'Checkpoint Module' : activeTopic.difficulty || 'DSA'}
                </div>
                <h1 className="text-sm lg:text-base font-black text-[var(--text-main)] leading-tight truncate">{activeTopic.title}</h1>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-sub)] border border-[var(--border)]">
                  <span className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider">
                    {doneVideos}/{topicVideos.length} videos
                  </span>
                  {doneVideos === topicVideos.length && topicVideos.length > 0 && (
                    <FiCheckCircle className="text-emerald-500" size={11} />
                  )}
                </div>

                {ctx?.isCompleted && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[9px] font-black uppercase tracking-wider">
                    <FiCheckCircle size={11} /> Completed
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextTopic}
                  title={ctx?.nextTopic ? `Continue to ${ctx.nextTopic.title}` : 'Back to roadmap'}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all bg-gradient-to-r from-[var(--primary)] to-amber-500 text-[var(--text-main)] shadow-md cursor-pointer hover:scale-[1.02]"
                >
                  Next Topic <FiChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* ─── VIDEO STRIP (switch videos without the sidebar) ─── */}
            {topicVideos.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-main)] border-b border-[var(--border)] overflow-x-auto no-scrollbar shrink-0">
                {topicVideos.map((v) => {
                  const active = v.key === activeVideoKey;
                  const done = (() => {
                    try {
                      return localStorage.getItem(`dsa_video_done_${activeTopicId}_${v.key}`) === 'true';
                    } catch {
                      return false;
                    }
                  })();
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => ctx.setActiveVideoKey(v.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                        active
                          ? 'bg-[var(--primary-light)] border-[var(--primary)]/30 text-[var(--primary)]'
                          : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--primary)]/30'
                      }`}
                    >
                      {done ? <FiCheckCircle size={10} className="text-emerald-500" /> : v.type === 'checkpoint' ? <span>🔖</span> : <FiPlay size={9} />}
                      {v.title}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ─── WORK REGION ─── */}
            <div className="flex-1 flex min-h-0 overflow-hidden relative">
              {isCheckpointVideo ? (
                /* Checkpoint split workspace */
                <div id="workspace-split-container" className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
                  {isMobile && (
                    <div className="flex p-2 bg-[var(--bg-sub)] border-b border-[var(--border)] shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => ctx.setActiveWorkspaceTab('learn')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                          ctx.activeWorkspaceTab === 'learn'
                            ? 'bg-[var(--primary)] text-[var(--text-main)] shadow-sm'
                            : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border)]'
                        }`}
                      >
                        🎬 Learn
                      </button>
                      <button
                        type="button"
                        onClick={() => ctx.setActiveWorkspaceTab('code')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                          ctx.activeWorkspaceTab === 'code'
                            ? 'bg-[var(--primary)] text-[var(--text-main)] shadow-sm'
                            : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border)]'
                        }`}
                      >
                        ⚡ Code
                      </button>
                    </div>
                  )}
                  <div
                    style={{ width: isMobile ? '100%' : `${ctx?.leftWidth}%` }}
                    className={`h-full flex flex-col border-r border-[var(--border)] bg-[var(--bg-main)] overflow-hidden shrink-0 ${isMobile && ctx.activeWorkspaceTab !== 'learn' ? 'hidden' : 'flex'}`}
                  >
                    <div className="bg-[var(--bg-main)] border-b border-[var(--border)] px-5 py-3 flex items-center justify-between shrink-0">
                      <div>
                        <div className="text-sm font-black text-[var(--text-main)] leading-tight">
                          {ctx.CHECKPOINT_LABELS?.[ctx?.activeCheckpoint] || activeVideo?.title}
                        </div>
                        {cpContent?.subtitle && <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">{cpContent.subtitle}</div>}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <VideoPlayer ctx={ctx} variant="checkpoint" />
                      {cpContent?.visualizationData && (
                        <div className="p-5 border-b border-[var(--border)] h-[600px]">
                          <RecursionVisualizer visualizationData={cpContent.visualizationData} />
                        </div>
                      )}
                      {cpContent && <ProblemSection ctx={ctx} variant="checkpoint" />}
                    </div>
                  </div>
                  {!isMobile && (
                    <div
                      className="w-1 h-full bg-[var(--border)] hover:bg-[var(--primary)] transition-colors cursor-col-resize flex-shrink-0"
                      onMouseDown={ctx?.startResize}
                    />
                  )}
                  <div
                    className="h-full min-w-0 flex-shrink-0 [&>div]:!h-full"
                    style={{ width: isMobile ? '100%' : `${100 - (ctx?.leftWidth || 60)}%` }}
                  >
                    <CodeWorkspace ctx={ctx} variant="checkpoint" />
                  </div>
                </div>
              ) : (
                /* Standard split workspace: video + lesson | editor */
                <div id="workspace-split-container" className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
                  <TopicNavigation ctx={ctx} mode="standard" region="split-tabs" />
                  <div
                    style={{ width: isMobile ? '100%' : `${ctx?.leftWidth}%` }}
                    className={`w-full h-full flex-col border-r border-[var(--border)] bg-[var(--bg-card)] overflow-hidden shrink-0 ${isMobile && ctx.activeWorkspaceTab !== 'learn' ? 'hidden' : 'flex'}`}
                  >
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-main)]">
                      <VideoPlayer ctx={ctx} variant="workspace" />
                      <ProblemSection ctx={ctx} variant="lovebabbar" />
                    </div>
                  </div>
                  {!isMobile && (
                    <div
                      onMouseDown={ctx?.startResize}
                      className="hidden lg:flex w-1 hover:w-1.5 bg-[var(--border-light)] hover:bg-[var(--brand-green)] cursor-col-resize transition-all shrink-0 items-center justify-center relative group"
                    />
                  )}
                  <div
                    className="h-full min-w-0 flex-shrink-0 [&>div]:!h-full"
                    style={{ width: isMobile ? '100%' : `${100 - (ctx?.leftWidth || 60)}%` }}
                  >
                    <CodeWorkspace ctx={ctx} variant="standard" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Celebration + submission preview */}
        {ctx?.celebrationData && <CelebrationOverlay ctx={ctx} />}
        {ctx?.selectedSubCode && <SubmissionModal ctx={ctx} />}
      </div>
    </div>
  );
};

export default DSAWorkspacePage;