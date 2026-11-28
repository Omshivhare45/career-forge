import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths, prefetch } from '../../../api/curriculum';
import { useCurriculum } from '../../../hooks/useCurriculum';
import { useDsaSelection } from '../hooks/useDsaSelection';
import ContentSkeleton from '../../../components/ContentSkeleton';
import { roadmapPath } from '../../../utils/guestNavigation';
import { useAuth } from '../../../context/AuthContext';
import { FiMenu, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
import { getDsaTopicNeighbors, getDsaTopicPath, getDsaTrackSections } from '../utils/dsaVideoCatalog';
import { DSA_TUTORS, DSA_TUTOR_OPTIONS, readDsaVideoDone } from '../../../utils/dsaPersonalization';
import WorkspaceSidebar from './WorkspaceSidebar';

// Course navigation outlives the active lesson, including cold detail reads.
export const DSAWorkspacePage = ({ activeTopic, pending, roadmapDomainId, renderLesson }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const selection = useDsaSelection(activeTopic);
  const { dsaTutor: tutor, selectDsaTutor: selectTutor, activeVideo, activeVideoKey } = selection;
  const [, progressChanged] = useState(0);
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

  const domainId = roadmapDomainId;
  const course = useCurriculum(domainId && paths.domain(domainId));
  const index = useCurriculum(domainId && paths.domainTopics(domainId));
  const courseTopics = useMemo(() => {
    const grouped = {};
    for (const topic of index.data?.data || []) (grouped[topic.phaseId] ||= []).push(topic);
    return grouped;
  }, [index.data]);
  const activeTopicId = activeTopic?._id;
  const completedTopicIds = useMemo(() => (user?.domainsProgress?.dsa?.completedTopics || [])
    .map(t => t.topicId?._id || t.topicId), [user]);
  const sections = useMemo(() => getDsaTrackSections(course.data?.data?.phases || [], courseTopics, tutor),
    [course.data, courseTopics, tutor]);
  const firstTopic = !activeTopic && sections.flatMap(section => section.topics)
    .find(topic => topic.videos.some(video => video.embedUrl));
  const firstLecture = firstTopic && firstTopic.videos.find(video => video.embedUrl);
  const previewSrc = firstLecture?.embedUrl && firstLecture.embedUrl + (firstLecture.embedUrl.includes('?') ? '&' : '?') + 'enablejsapi=1';
  useYouTubePlayer({ iframeId: 'roadmap-preview-video', enabled: Boolean(previewSrc), identity: previewSrc });
  const sectionTopic = sections.flatMap((section) => section.topics).find((item) =>
    item._id === activeTopicId && item.videos.some((video) => video.key === activeVideoKey));
  const topicVideos = sectionTopic?.videos || selection.topicVideos;
  const enrolledDomain = user?.activeDomain || user?.selectedDomain;
  const videoDone = (enrolledDomain?._id || enrolledDomain) === domainId ? readDsaVideoDone : () => false;
  const mappedVideos = topicVideos.filter((video) => video.videoId);
  const doneVideos = mappedVideos.filter((video) => videoDone(activeTopicId, video)).length;
  const { previous, next } = getDsaTopicNeighbors(sections, activeTopicId, activeVideo);

  const handleSelectTopic = (topic) => {
    navigate(getDsaTopicPath(topic));
    if (isMobile) setSidebarOpen(false);
  };

  const nextId = next?._id;
  useEffect(() => {
    if (!activeTopicId || !nextId || nextId === activeTopicId) return;
    const timer = setTimeout(() => prefetch(paths.topic(nextId)), 350);
    return () => clearTimeout(timer);
  }, [activeTopicId, nextId]);

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
        loading={course.loading || index.loading}
        activeVideoKey={activeVideoKey || firstLecture?.key}
        videoDone={videoDone}
        activeTopicId={activeTopicId || firstTopic?._id}
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

        {(course.error || index.error) && <p role="alert" className="p-3">Could not load the course navigation.</p>}
        <label className="flex items-center justify-end gap-2 px-4 py-2 shrink-0 bg-[var(--bg-card)] border-b border-[var(--border)] text-xs font-bold text-[var(--text-main)]">
          Learning track
          <select value={tutor} onChange={(event) => selectTutor(event.target.value)}
            className="rounded-lg px-2 py-1 border border-[var(--border)] bg-[var(--bg-sub)] text-[var(--text-main)]">
            {DSA_TUTOR_OPTIONS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        {(pending || ((course.loading || index.loading) && !activeTopic)) ? (
          <ContentSkeleton title="Loading lesson" />
        ) : !activeTopic ? (
          firstLecture ? (
            <section className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              <iframe className="aspect-video w-full rounded-xl bg-black"
                id="roadmap-preview-video" key={previewSrc} src={previewSrc} title={firstLecture.title}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
              <h1 className="mt-4 text-lg font-bold">{firstLecture.title}</h1>
              <button type="button" className="mt-2 text-sm font-bold text-[var(--primary)]"
                onClick={() => navigate(getDsaTopicPath(firstTopic, firstLecture))}>Open lesson workspace</button>
            </section>
          ) : !(course.error || index.error) && <p role="status" className="p-5">No videos are available for this track yet.</p>
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

                {completedTopicIds.includes(activeTopicId) && (
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
                  onClick={() => next ? handleSelectTopic(next) : navigate(roadmapPath(domainId))}
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
                  onChange={(event) => selection.setActiveVideoKey(event.target.value
                    ? "cp:" + event.target.value : topicVideos[0]?.key || "")}
                  className="min-w-0 rounded-lg px-2 py-1 border border-[var(--border)] bg-[var(--bg-sub)]">
                  <option value="">Choose a checkpoint</option>
                  {activeTopic.checkpoints.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            )}
            {renderLesson?.({ selection: { ...selection, onProgressChange: () => progressChanged(n => n + 1) }, next })}
          </>
        )}
      </div>
    </div>
  );
};

export default DSAWorkspacePage;