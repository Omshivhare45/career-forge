import { FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import RecursionVisualizer from '../../../components/RecursionVisualizer';
import TopicSidebar from './TopicSidebar';
import { VideoPlayer } from './VideoPlayer';
import ProblemSection from './ProblemSection';
import { CodeWorkspace } from './CodeWorkspace';
import { TopicNavigation } from './TopicNavigation';
import { CelebrationOverlay } from './CelebrationOverlay';
import { SubmissionModal } from './SubmissionModal';
import StepperBar from './StepperBar';

// Unified coordinating shell for the topic page.
// Determines the variant entirely from ctx and renders the single appropriate
// layout structure for every domain:
//   isCheckpointMode → Checkpoint Module (Start Coding) split workspace
//   else             → roadmap sidebar + dual-pane workspace (Love Babbar /
//                      Striver A2Z / non-coding DevOps)
// Faithful port of the original monolithic TopicDetail rendering shells.
export const DSATopicLayout = ({ ctx }) => {
  const {
    loading,
    topic,
    isMobile,
    isCheckpointMode,
    shouldSplitWorkspace,
    isDragging,
    activeWorkspaceTab,
    isCpSidebarOpen,
    setIsCpSidebarOpen,
    leftWidth,
    startResize,
    CHECKPOINT_LABELS,
    activeCheckpoint,
    completedCheckpoints,
    activeCheckpointContent,
    checkpointVideoEmbedUrl,
    dsaCourse,
    learningStep,
    leftTab,
    showConfetti,
    particles,
    selectedSubCode
  } = ctx;

  // Loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!topic) return null;

  // ─── CHECKPOINT MODULE (Start Coding) ─────────────────────────────────────
  if (isCheckpointMode) {
    const cpContent = activeCheckpointContent;

    return (
      <div className={`flex h-full w-full overflow-hidden bg-[var(--bg-main)] relative ${isDragging ? 'workspace-dragging' : ''}`}>
        {/* Backdrop overlay for the Checkpoint sidebar on mobile */}
        {isMobile && isCpSidebarOpen && (
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 cursor-pointer"
            onClick={() => setIsCpSidebarOpen(false)}
          />
        )}

        {/* Checkpoint journey sidebar */}
        <TopicSidebar ctx={ctx} mode="checkpoint" />

        {/* Main split workspace */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Checkpoint mobile tabs header */}
          {isMobile && <TopicNavigation ctx={ctx} mode="checkpoint" region="header" />}

          <div id="workspace-split-container" className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative">
            {/* Desktop sidebar toggle */}
            <TopicNavigation ctx={ctx} mode="checkpoint" region="split-top" />

            {/* LEFT: video + visualizer + challenge */}
            <div
              style={{ width: isMobile ? '100%' : `${leftWidth}%` }}
              className={`h-full flex flex-col border-r border-[var(--border)] bg-[var(--bg-main)] overflow-hidden shrink-0 ${isMobile && activeWorkspaceTab !== 'learn' ? 'hidden' : 'flex'}`}
            >
              {/* Checkpoint header bar */}
              <div className="bg-[var(--bg-main)] border-b border-[var(--border)] pl-16 pr-5 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-black text-[var(--text-main)] leading-tight">{CHECKPOINT_LABELS[activeCheckpoint]}</div>
                    {cpContent?.subtitle && (
                      <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">{cpContent.subtitle}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {completedCheckpoints.includes(activeCheckpoint) && (
                    <div className="px-2.5 py-1 text-emerald-500 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                      <FiCheckCircle size={12} /> Completed
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* VIDEO SECTION */}
                {checkpointVideoEmbedUrl && <VideoPlayer ctx={ctx} variant="checkpoint" />}

                {/* VISUALIZER SECTION */}
                {cpContent && cpContent.visualizationData && (
                  <div className="p-5 border-b border-[var(--border)] h-[600px]">
                    <RecursionVisualizer visualizationData={cpContent.visualizationData} />
                  </div>
                )}

                {/* CHALLENGE SECTION */}
                {cpContent && <ProblemSection ctx={ctx} variant="checkpoint" />}
              </div>
            </div>

            {/* Resize handle */}
            {!isMobile && (
              <div
                className="w-1 h-full bg-[var(--border)] hover:bg-[var(--primary)] transition-colors cursor-col-resize flex-shrink-0"
                onMouseDown={startResize}
              />
            )}

            {/* RIGHT: editor + console */}
            <CodeWorkspace ctx={ctx} variant="checkpoint" />
          </div>
        </div>
      </div>
    );
  }

  // ─── STANDARD SHELL (Love Babbar / Striver A2Z / non-coding) ──────────────
  return (
    <div className={`flex flex-col lg:flex-row h-full w-full overflow-hidden bg-[var(--bg-main)] transition-colors duration-300 relative select-none ${isDragging ? 'workspace-dragging' : ''}`}>
      {/* Background confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: '50%',
                transform: `rotate(${p.rotation}deg)`
              }}
              animate={{
                y: ['0vh', '100vh'],
                x: [`${p.x}%`, `${p.x + p.speedX * 4}%`],
                rotate: [p.rotation, p.rotation + 360]
              }}
              transition={{ duration: 2.5 + Math.random() * 1.5, ease: 'linear' }}
            />
          ))}
        </div>
      )}

      {/* Roadmap navigator sidebar */}
      <TopicSidebar ctx={ctx} mode="roadmap" />

      {/* Dual-pane split workspace */}
      <div id="workspace-split-container" className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative">
        {/* Desktop sidebar toggle */}
        <TopicNavigation ctx={ctx} mode="standard" region="split-top" />

        {/* Mobile Learn/Code switcher */}
        <TopicNavigation ctx={ctx} mode="standard" region="split-tabs" />

        {/* LEFT PANE */}
        <div
          style={{ width: isMobile ? '100%' : shouldSplitWorkspace ? `${leftWidth}%` : '100%' }}
          className={`w-full lg:w-auto h-full flex-col border-r border-[var(--border)] bg-[var(--bg-card)] overflow-hidden shrink-0 ${isMobile && activeWorkspaceTab !== 'learn' && shouldSplitWorkspace ? 'hidden' : 'flex'}`}
        >
          {!shouldSplitWorkspace ? (
            /* Non-coding / DevOps */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg-card)]">
              <VideoPlayer ctx={ctx} variant="devops" />
              <ProblemSection ctx={ctx} variant="noncoding" />
            </div>
          ) : (
            <>
              {dsaCourse !== 'default' && learningStep !== 1 && learningStep !== 'transition' && (
                <StepperBar ctx={ctx} />
              )}

              {dsaCourse === 'default' ? (
                /* Love Babbar / default course */
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-main)]">
                  <VideoPlayer ctx={ctx} variant="lovebabbar" />
                  <ProblemSection ctx={ctx} variant="lovebabbar" />
                </div>
              ) : learningStep === 1 ? (
                <VideoPlayer ctx={ctx} variant="striver-step1" />
              ) : learningStep === 'transition' ? (
                <ProblemSection ctx={ctx} variant="striver-transition" />
              ) : (
                /* Striver Step 2 — tabbed content */
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[var(--bg-card)]">
                  {learningStep >= 2 && (
                    <>
                      {leftTab === 'description' && <ProblemSection ctx={ctx} variant="striver-description" />}
                      {leftTab === 'approach' && <ProblemSection ctx={ctx} variant="striver-approach" />}
                      {leftTab === 'submissions' && <ProblemSection ctx={ctx} variant="striver-submissions" />}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Resizable divider */}
        {shouldSplitWorkspace && (
          <div
            onMouseDown={startResize}
            className={`hidden lg:flex w-1 hover:w-1.5 bg-[var(--border-light)] hover:bg-[var(--brand-green)] cursor-col-resize transition-all shrink-0 items-center justify-center relative group ${isDragging ? 'bg-[var(--brand-green)] w-1.5' : ''}`}
          >
            <div className="absolute h-10 w-0.5 bg-gray-400 rounded-full group-hover:bg-[var(--bg-card)]" />
          </div>
        )}

        {/* RIGHT: editor + console */}
        {shouldSplitWorkspace && <CodeWorkspace ctx={ctx} variant="standard" />}
      </div>

      {/* Submission preview modal */}
      {selectedSubCode && <SubmissionModal ctx={ctx} />}

      {/* Gamified celebration overlay */}
      <CelebrationOverlay ctx={ctx} />
    </div>
  );
};