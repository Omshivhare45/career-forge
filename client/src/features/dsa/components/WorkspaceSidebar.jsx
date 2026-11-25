import { paths, prefetch } from '../../../api/curriculum';
import { useState } from 'react';
import { FiChevronDown, FiCheckCircle, FiCircle, FiFolder } from 'react-icons/fi';

export const WorkspaceSidebar = ({
  sections,
  loading,
  activeVideoKey,
  videoDone,
  activeTopicId,
  completedTopicIds = [],
  onSelectTopic,
  onSelectLesson,
  isMobile,
  open
}) => {
  const [expandedPhases, setExpandedPhases] = useState({});
  const selectedPhase = sections.find((section) => section.topics.some((topic) =>
    topic._id === activeTopicId && topic.videos.some((video) => video.key === activeVideoKey))) ||
    sections.find((section) => section.topics.some((topic) => topic._id === activeTopicId));
  const defaultPhase = selectedPhase?._id || sections[0]?._id;
  const isPhaseOpen = (phaseId) => expandedPhases[phaseId] ?? (phaseId === defaultPhase);

  const togglePhase = (phaseId) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !(prev[phaseId] ?? (phaseId === defaultPhase)) }));
  };
  const topicIds = new Set(sections.flatMap((section) => section.topics.map((topic) => topic._id)));
  const totalTopics = topicIds.size;
  const doneTopics = completedTopicIds.filter((id) => topicIds.has(id)).length;
  return (
    <aside
      className={`bg-[var(--bg-card)] flex flex-col h-full overflow-hidden shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isMobile
          ? `absolute top-0 left-0 bottom-0 z-50 shadow-2xl ${open ? 'w-72 max-w-[85vw] translate-x-0' : 'w-72 max-w-[85vw] -translate-x-full'}`
          : `${open ? 'w-60 xl:w-80 border-r border-[var(--border)]' : 'w-0 border-r-0'}`
        }`}
    >
      {open && (
        <>
          {/* Header */}
          <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-lg shadow-inner">🗺️</div>
              <div>
                <div className="font-black text-[var(--text-main)] text-sm leading-tight">DSA Workspace</div>
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Learning Roadmap</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[var(--bg-sub)] rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: totalTopics > 0 ? `${Math.round((doneTopics / totalTopics) * 100)}%` : '0%' }}
                />
              </div>
              <span className="text-[9px] font-black text-[var(--text-light)] shrink-0">{doneTopics}/{totalTopics}</span>
            </div>
          </div>

          {/* Scrollable accordion */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[var(--primary)] border-t-transparent mx-auto" />
              </div>
            )}

            {!loading && sections.length === 0 && <p className="p-6 text-xs text-[var(--text-muted)]">No topics are available for this track.</p>}
            {sections.map((phase) => {
              const phaseId = phase._id;
              const topics = phase.topics;
              const isOpen = isPhaseOpen(phaseId);
              const phaseDone = topics.filter((topic) => completedTopicIds.some((ct) => ct === topic._id)).length;

              return (
                <div key={phaseId} className="border-b border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => togglePhase(phaseId)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-sub)] transition-colors cursor-pointer text-left"
                  >
                    <FiChevronDown className={`text-[var(--text-light)] transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`} size={14} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-[var(--primary)] tracking-widest uppercase">Lvl {phase.phaseNumber ?? 0}</span>
                        <FiFolder size={11} className="text-[var(--text-light)]" />
                      </div>
                      <div className="text-[11px] font-black text-[var(--text-main)] leading-tight truncate mt-0.5">{phase.name}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {phaseDone > 0 && (
                        <span className={`text-[8px] font-black ${phaseDone === topics.length ? 'text-emerald-500' : 'text-[var(--text-light)]'}`}>
                          {phaseDone}/{topics.length}
                        </span>
                      )}
                      <span className="text-[8px] font-black text-[var(--text-light)]">{topics.length} topics</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pb-2">
                      {topics.map((topic) => {
                        const topicId = topic._id;
                        const videos = topic.videos.filter((video) => video.videoId);
                        const isActiveTopic = topicId === activeTopicId && (!activeVideoKey || topic.videos.some((video) => video.key === activeVideoKey));
                        const isDone = completedTopicIds.some((ct) => ct === topicId);
                        const doneCount = videos.filter((v) => videoDone(topicId, v)).length;
                        const allVideosDone = videos.length > 0 && doneCount === videos.length;

                        return (
                          <div key={topicId} className="ml-3 mr-2 border-l border-[var(--border)]">
                            <button
                              type="button"
                              onPointerEnter={() => prefetch(paths.topic(topicId))}
                              onFocus={() => prefetch(paths.topic(topicId))}
                              onClick={() => onSelectTopic(topic)}
                              className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                                isActiveTopic
                                  ? 'bg-[var(--primary-light)] border-[var(--primary)]/20 ml-2 mr-1'
                                  : 'border-transparent hover:bg-[var(--bg-sub)] ml-2 mr-1'
                              }`}
                            >
                              <span className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[9px] font-black transition-all ${
                                isDone
                                  ? 'bg-emerald-500 text-[var(--text-main)]'
                                  : isActiveTopic
                                    ? 'bg-[var(--primary)] text-[var(--text-main)]'
                                    : 'bg-[var(--bg-sub)] text-[var(--text-light)]'
                              }`}>
                                {isDone ? <FiCheckCircle size={11} /> : allVideosDone ? '✓' : <FiCircle size={9} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className={`text-[11px] font-black leading-tight block ${isActiveTopic ? 'text-[var(--primary)]' : isDone ? 'text-[var(--text-main)]' : 'text-[var(--text-light)]'}`}>
                                  {topic.title}
                                </span>
                                <span className="text-[8px] font-bold text-[var(--text-light)] uppercase tracking-tighter block mt-0.5">
                                  {topic.isCheckpointModule ? 'Checkpoint Module' : topic.difficulty || 'Beginner'} • {videos.length} videos
                                </span>
                              </span>
                              <span className="text-[8px] font-black text-[var(--text-light)] shrink-0">{doneCount}/{videos.length}</span>
                            </button>
                            {isActiveTopic && (
                              <ul aria-label={topic.title + ' subtopics'} className="ml-5 mt-1 space-y-1 border-l border-[var(--border)] pl-2 pb-2">
                                {topic.videos.map((video) => {
                                  const active = video.key === activeVideoKey;
                                  const done = videoDone(topicId, video);
                                  return (
                                    <li key={video.key}>
                                      <button type="button" onClick={() => onSelectLesson(topic, video)}
                                        aria-current={active ? 'step' : undefined}
                                        className={'flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-bold transition-colors ' + (active
                                          ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                                          : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-sub)] hover:text-[var(--text-main)]')}>
                                        <span aria-hidden="true" className="mt-0.5 shrink-0">{done ? <FiCheckCircle /> : <FiCircle size={12} />}</span>
                                        <span className="min-w-0 break-words">
                                          {video.title}
                                          {!video.videoId && <span className="mt-0.5 block text-[10px] font-normal">Video unavailable</span>}
                                          {done && <span className="sr-only"> ? Completed</span>}
                                        </span>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
};

export default WorkspaceSidebar;