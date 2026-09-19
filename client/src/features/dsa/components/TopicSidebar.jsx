import { Link } from 'react-router-dom';
import { FiArrowLeft, FiZap, FiCheckCircle, FiList, FiMinimize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Sidebar for the topic learning page.
// Modes:
//   'checkpoint' → journey navigator used for the Checkpoint Module (uses isCpSidebarOpen)
//   'roadmap'    → phase topic navigator used for standard DSA/WebDev/DevOps topics (uses isSidebarOpen)
const TopicSidebar = ({ ctx, mode }) => {
  const {
    id,
    topic,
    isMobile,
    availableLanguages,
    selectedLang, setSelectedLang,
    setEditorCode,
    CHECKPOINTS, CHECKPOINT_LABELS, CHECKPOINT_ICONS,
    activeCheckpoint, setActiveCheckpoint,
    completedCheckpoints,
    setCheckpointVideoFinished,
    setCheckpointCodePassed,
    setCompilerStatus,
    setTestResults,
    setConsoleLogs,
    isCpSidebarOpen, setIsCpSidebarOpen,
    isSidebarOpen,
    isWebDevDomain,
    allTopics,
    activeDomainProgress,
    setSubmitting,
    navigate
  } = ctx;

  // ─── CHECKPOINT MODE ───────────────────────────────────────────────────────
  if (mode === 'checkpoint') {
    const allDone = completedCheckpoints.length === CHECKPOINTS.length;

    return (
      <div className={`bg-[var(--bg-card)] flex flex-col h-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0
        ${isMobile
          ? `absolute top-0 left-0 bottom-0 z-50 shadow-2xl ${isCpSidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full'}`
          : `${isCpSidebarOpen ? 'w-72 border-r border-[var(--border)] opacity-100' : 'w-0 opacity-0 border-r-0'}`
        }
      `}>

        {/* Minimal Header */}
        <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0 transition-all duration-500">
          <Link to="/roadmap" className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] text-[9px] font-black uppercase tracking-widest mb-4 transition-colors group">
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Roadmap
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] flex items-center justify-center text-xl shadow-sm border border-[var(--border)]">🚀</div>
            <div>
              <div className="text-[var(--text-main)] font-black text-sm leading-tight">{topic?.title || 'Start Coding'}</div>
              <div className="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-widest mt-1">{topic?.difficulty ? `Level 1 · ${topic.difficulty}` : 'Level 0 · Foundations'}</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-wider">Progress</span>
              <span className="text-[var(--text-main)] text-[9px] font-black">{completedCheckpoints.length} / {CHECKPOINTS.length}</span>
            </div>
            <div className="h-1.5 bg-[var(--bg-sub)] rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[var(--primary)] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${(completedCheckpoints.length / CHECKPOINTS.length) * 100}%` }}
              />
            </div>
            {allDone && (
              <div className="text-[9px] font-black text-emerald-500 text-center pt-0.5">🎓 Mastered!</div>
            )}
          </div>
        </div>

        {/* Language selector */}
        <div className="px-4 pt-3 pb-3 border-b border-[var(--border)] shrink-0">
          <div className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-wider mb-2">Coding Language</div>
          <div className="flex gap-1">
            {availableLanguages.map(lang => {
              const label = lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang.toUpperCase();
              return (
                <button
                  key={lang}
                  onClick={() => { setSelectedLang(lang); setEditorCode(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${selectedLang === lang ? 'bg-[var(--primary)] text-[var(--text-main)] shadow-sm' : 'bg-[var(--bg-sub)] text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>


        {/* Checkpoint navigation list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          <div className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-widest px-1 mb-1">Your Journey</div>
          {CHECKPOINTS.map((cpId, idx) => {
            const isActive = activeCheckpoint === cpId;
            const isDone = completedCheckpoints.includes(cpId);
            const isLocked = false;
            const cpLabel = CHECKPOINT_LABELS[cpId];
            const cpIcon = CHECKPOINT_ICONS[cpId];

            return (
              <button
                key={cpId}
                disabled={isLocked}
                onClick={() => {
                  if (isLocked) { toast.error('Complete the previous checkpoint first! 🔒'); return; }
                  setActiveCheckpoint(cpId);
                  localStorage.setItem(`dsa_checkpoint_${id}`, cpId);
                  setCheckpointVideoFinished(false);
                  setCheckpointCodePassed(false);
                  setEditorCode('');
                  setCompilerStatus('idle');
                  setTestResults([]);
                  setConsoleLogs([]);
                  setIsCpSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--primary-light)] border-[var(--primary)]/40 shadow-sm ring-1 ring-[var(--primary)]/20'
                    : isDone
                      ? 'bg-emerald-500/8 border-emerald-500/25 hover:bg-emerald-500/12 cursor-pointer'
                      : isLocked
                        ? 'bg-[var(--bg-sub)] border-dashed border-[var(--border)] opacity-35 cursor-not-allowed'
                        : 'bg-[var(--bg-sub)] border-[var(--border)] hover:bg-[var(--bg-card)] cursor-pointer'
                }`}
              >
                {/* Status indicator */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black shadow-sm border ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-[var(--text-main)]'
                    : isActive
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--text-main)]'
                      : isLocked
                        ? 'bg-[var(--border-light)] border-[var(--border)] text-[var(--text-light)]'
                        : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'
                }`}>
                  {isDone ? '✓' : isLocked ? '🔒' : cpIcon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-black leading-tight truncate ${
                    isActive ? 'text-[var(--primary)]' : isDone ? 'text-emerald-500' : 'text-[var(--text-main)]'
                  }`}>
                    {cpLabel}
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] font-semibold mt-0.5 transition-colors">
                    {isDone ? '✅ Completed' : isActive ? '▶ In progress' : `Watch & Code`}
                  </div>
                </div>

                {/* Checkpoint number badge */}
                <div className={`text-[8px] font-black rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-emerald-500/20 text-emerald-500' : isActive ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                }`}>
                  {idx + 1}
                </div>
              </button>
            );
          })}
        </div>

        {/* All-done: Claim rewards button */}
        {allDone && (
          <div className="p-4 border-t border-[var(--border)] bg-gradient-to-r from-emerald-500/10 to-teal-500/10 shrink-0">
            <div className="text-center space-y-3">
              <div className="text-3xl">🎓</div>
              <div>
                <div className="text-sm font-black text-emerald-500">{topic?.title || 'Start Coding'} Complete!</div>
                <div className="text-[9px] text-[var(--text-muted)] font-semibold mt-0.5">You've mastered all {CHECKPOINTS.length} checkpoints</div>
              </div>
              <button
                onClick={async () => {
                  try {
                    setSubmitting(true);
                    const api = (await import('../../../api/axios')).default;
                    await api.post('/progress/complete-topic', {
                      topicId: id, studyTimeMinutes: 90,
                      notes: `Completed all ${CHECKPOINTS.length} checkpoints for ${topic?.title || 'Start Coding'}!`,
                      difficultyFeedback: 'easy', confidenceLevel: 5, revisionNeeded: false
                    });
                    await ctx.refreshUser();
                    toast.success(`🚀 ${topic?.title || 'Start Coding'} Complete! +150 XP earned!`);
                    navigate('/roadmap');
                  } catch { toast.error('Failed to save. Try again.'); }
                  finally { setSubmitting(false); }
                }}
                disabled={ctx.submitting}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-[var(--text-main)] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20"
              >
                Claim Rewards 🏆
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── ROADMAP NAVIGATOR MODE ───────────────────────────────────────────────
  return (
    <div className={`flex-shrink-0 bg-[var(--bg-card)] hidden lg:flex flex-col h-full overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
      isSidebarOpen ? 'w-80 border-r border-[var(--border)] opacity-100' : 'w-0 opacity-0 overflow-hidden'
    }`}>
      <div className="w-80 p-5 flex-1">
        <Link to="/roadmap" className="flex items-center gap-2 text-[var(--text-light)] font-black text-[9px] uppercase tracking-widest mb-6 hover:text-[var(--primary)] transition-colors group">
          <FiArrowLeft className="group-hover:-translate-x-0.5 transition-transform" /> BACK TO MAP
        </Link>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[var(--primary-light)] text-[var(--primary)] rounded-lg flex items-center justify-center text-base shadow-inner">
            <FiZap />
          </div>
          <div>
            <div className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-widest leading-none mb-0.5">{isWebDevDomain ? 'Web Dev Expedition' : 'DSA Expedition'}</div>
            <div className="font-black text-[var(--text-main)] text-xs leading-tight">Level {topic.phaseId?.phaseNumber || 0}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          {allTopics.map((t, index) => {
            const active = t._id === id;
            const done = activeDomainProgress.completedTopics?.some(ct => ct.topicId === t._id || ct.topicId?._id === t._id);
            return (
              <Link
                key={t._id}
                to={`/topic/${t._id}`}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${
                  active
                    ? 'bg-[var(--primary-light)] border-[var(--primary)]/20 shadow-sm'
                    : 'hover:bg-[var(--bg-sub)] border-transparent'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all ${
                  done
                    ? 'bg-emerald-500 text-[var(--text-main)] shadow'
                    : active
                      ? 'bg-[var(--primary)] text-[var(--text-main)] shadow'
                      : 'bg-[var(--bg-sub)] text-[var(--text-light)]'
                }`}>
                  {done ? <FiCheckCircle className="text-[10px]" /> : <span className="text-[8px] font-black">{index + 1}</span>}
                </div>
                <div>
                  <span className={`text-[11px] font-black leading-tight block mb-0.5 ${active ? 'text-[var(--primary)]' : done ? 'text-[var(--text-main)]' : 'text-[var(--text-light)]'}`}>
                    {t.title}
                  </span>
                  <div className="flex items-center gap-1.5 text-[8px] font-bold text-[var(--text-light)] uppercase tracking-tighter">
                     <span>{t.difficulty}</span>
                     <span>•</span>
                     <span>{t.estimatedTime}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopicSidebar;