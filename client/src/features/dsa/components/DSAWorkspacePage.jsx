import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDomain, getDomainTopics } from '../../../api/curriculum';
import { useAuth } from '../../../context/AuthContext';
import { FiMenu, FiChevronRight, FiCheckCircle, FiPlay, FiZap, FiBookOpen } from 'react-icons/fi';
import { getDsaTopicNeighbors, getDsaTopicPath, getDsaTrackSections } from '../utils/dsaVideoCatalog';
import { DSA_TUTORS, DSA_TUTOR_OPTIONS, readDsaVideoDone, readStoredDsaTutor, writeStoredDsaTutor } from '../../../utils/dsaPersonalization';
import WorkspaceSidebar from './WorkspaceSidebar';
import { VideoPlayer } from './VideoPlayer';
const ProblemSection = lazy(() => import('./ProblemSection'));
const CodeWorkspace = lazy(() => import('./CodeWorkspace').then((module) => ({ default: module.CodeWorkspace })));
import { TopicNavigation } from './TopicNavigation';
import { CelebrationOverlay } from './CelebrationOverlay';
import { SubmissionModal } from './SubmissionModal';
const RecursionVisualizer = lazy(() => import('../../../components/RecursionVisualizer'));

// Unified DSA learning workspace.
// One contiguous page: sidebar (phases → topics) + a stable
// main area (title/progress header → video strip → video/lesson → editor).
//   ctx truthy  → deep-linked topic workspace (/topic/:id), fully interactive.
//   ctx null    → read-only roadmap workspace (/roadmap) that deep-links into
//                 /topic/:id when a topic is opened.
export const DSAWorkspacePage = ({ ctx, roadmapDomainId, roadmapCourse }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roadmapTutor, setRoadmapTutor] = useState(readStoredDsaTutor);
  const tutor = ctx?.dsaTutor || roadmapTutor;
  const selectTutor = ctx?.selectDsaTutor || ((value) => setRoadmapTutor(writeStoredDsaTutor(value)));

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

  const domainId = ctx?.topic?.domainId?._id || roadmapDomainId || user?.selectedDomain?._id || user?.selectedDomain;

  useEffect(() => {
    if (!domainId) return;
    let cancelled = false;
    Promise.all([roadmapCourse || getDomain(domainId), getDomainTopics(domainId)])
      .then(([domain, topics]) => {
        if (cancelled) return;
        const byPhase = {};
        for (const topic of topics) (byPhase[topic.phaseId] ||= []).push(topic);
        setCourse(domain);
        setCourseTopics(byPhase);
      })
      .catch(() => {/* roadmap shell handles errors */}
      )
      .finally(() => {
        if (!cancelled) setCourseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [domainId, roadmapCourse]);

  const activeTopicId = ctx?.id || null;
  const activeTopic = ctx?.topic || null;

  const activeVideo = ctx?.activeVideo || null;
  const activeVideoKey = ctx?.activeVideoKey || null;

  const completedTopicIds = useMemo(() => {
    const list = ctx?.activeDomainProgress?.completedTopics || user?.domainsProgress?.dsa?.completedTopics || [];
    return list.map((t) => t.topicId?._id || t.topicId).filter(Boolean);
  }, [ctx, user]);

  const sections = useMemo(() => getDsaTrackSections(course?.phases || [], courseTopics, tutor),
    [course, courseTopics, tutor]);
  const sectionTopic = sections.flatMap((section) => section.topics).find((item) =>
    item._id === activeTopicId && item.videos.some((video) => video.key === activeVideoKey));
  const topicVideos = sectionTopic?.videos || ctx?.topicVideos || [];
  const videoDone = ctx?.isDsaVideoDone || (user ? readDsaVideoDone : () => false);
  const mappedVideos = topicVideos.filter((video) => video.videoId);
  const doneVideos = mappedVideos.filter((video) => videoDone(activeTopicId, video)).length;
  const { previous, next } = getDsaTopicNeighbors(sections, activeTopicId, activeVideo);

  const handleSelectTopic = (topic) => {
    navigate(getDsaTopicPath(topic));
    if (isMobile) setSidebarOpen(false);
  };

  const missingVideo = (
    <p className="px-5 py-4 text-xs font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
      No video is mapped for this lesson in {DSA_TUTOR_OPTIONS.find((option) => option.key === tutor)?.label}.
    </p>
  );
  const sectionCtx = ctx && { ...ctx, nextTopic: next, nextTopicPath: next && getDsaTopicPath(next) };
  const isCheckpointVideo = activeVideo?.type === 'checkpoint';
  const cpContent = ctx?.activeCheckpointContent || null;

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[var(--bg-main)] relative">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <WorkspaceSidebar
        sections={sections}
        loading={courseLoading}
        activeVideoKey={activeVideoKey}
        videoDone={videoDone}
        activeTopicId={activeTopicId}
        completedTopicIds={completedTopicIds}
        onSelectTopic={handleSelectTopic}
        onSelectLesson={(topic, video) => {
          navigate(getDsaTopicPath(topic, video));
          if (isMobile) setSidebarOpen(false);
        }}
        isMobile={isMobile}
        open={sidebarOpen}
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

        <label className="flex items-center justify-end gap-2 px-4 py-2 shrink-0 bg-[var(--bg-card)] border-b border-[var(--border)] text-xs font-bold text-[var(--text-main)]">
          Learning track
          <select value={tutor} onChange={(event) => selectTutor(event.target.value)}
            className="rounded-lg px-2 py-1 border border-[var(--border)] bg-[var(--bg-sub)] text-[var(--text-main)]">
            {DSA_TUTOR_OPTIONS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
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
            <div className="bg-[var(--bg-card)] border-b border-[var(--border)] px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
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
                    {doneVideos}/{mappedVideos.length} videos
                  </span>
                  {doneVideos === mappedVideos.length && mappedVideos.length > 0 && (
                    <FiCheckCircle className="text-emerald-500" size={11} />
                  )}
                </div>

                {ctx?.isCompleted && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[9px] font-black uppercase tracking-wider">
                    <FiCheckCircle size={11} /> Completed
                  </div>
                )}

                {previous && (
                  <button type="button" onClick={() => handleSelectTopic(previous)}
                    className="rounded-lg px-2 py-2 text-[10px] font-bold border border-[var(--border)]"
                    aria-label="Previous topic" title={previous.title}>Previous</button>
                )}
                <button
                  type="button"
                  onClick={() => next ? handleSelectTopic(next) : navigate(ctx.roadmapLink)}
                  title={next ? next.title : 'Back to roadmap'}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all bg-gradient-to-r from-[var(--primary)] to-amber-500 text-[var(--text-main)] shadow-md cursor-pointer hover:scale-[1.02]"
                >
                  {next ? 'Next Topic' : 'Roadmap'} <FiChevronRight size={12} />
                </button>
              </div>
            </div>

            {tutor === DSA_TUTORS.BABBAR && activeTopic.checkpoints?.length > 0 && (
              <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b border-[var(--border)]">
                Practice checkpoint
                <select value={activeVideo?.checkpointId || ""}
                  onChange={(event) => ctx.setActiveVideoKey(event.target.value
                    ? "cp:" + event.target.value : topicVideos[0]?.key || "")}
                  className="min-w-0 rounded-lg px-2 py-1 border border-[var(--border)] bg-[var(--bg-sub)]">
                  <option value="">Choose a checkpoint</option>
                  {activeTopic.checkpoints.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            )}
            {/* ─── WORK REGION ─── */}
            <Suspense fallback={<p className="p-4 text-sm" role="status">Loading lesson workspace?</p>}>
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
                      {activeVideo?.embedUrl ? <VideoPlayer ctx={ctx} variant="checkpoint" /> : missingVideo}
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
                      {activeVideo?.embedUrl ? <VideoPlayer ctx={ctx} variant="workspace" /> : missingVideo}
                      <ProblemSection ctx={sectionCtx} variant="lovebabbar" />
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
            </Suspense>
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