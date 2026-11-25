import { lazy, Suspense } from 'react';
import { useDSATopic } from '../hooks/useDSATopic';
import { getDsaTopicPath } from '../utils/dsaVideoCatalog';
import { DSA_TUTOR_OPTIONS } from '../../../utils/dsaPersonalization';
import { VideoPlayer } from './VideoPlayer';
import { TopicNavigation } from './TopicNavigation';
import { CelebrationOverlay } from './CelebrationOverlay';
import { SubmissionModal } from './SubmissionModal';

const DSATopicLayout = lazy(() => import('./DSATopicLayout').then(module => ({ default: module.DSATopicLayout })));
const ProblemSection = lazy(() => import('./ProblemSection'));
const CodeWorkspace = lazy(() => import('./CodeWorkspace').then((module) => ({ default: module.CodeWorkspace })));
const RecursionVisualizer = lazy(() => import('../../../components/RecursionVisualizer'));

export default function TopicLesson({ topic, selection, next }) {
  const ctx = useDSATopic(topic, selection);
  if (!ctx.isDsaDomain) return <DSATopicLayout ctx={ctx} />;
  const { isMobile, activeVideo, activeCheckpointContent: cpContent } = ctx;
  const isCheckpointVideo = activeVideo?.type === 'checkpoint';
  const sectionCtx = { ...ctx, nextTopic: next, nextTopicPath: next && getDsaTopicPath(next) };
  const missingVideo = (
    <p className="px-5 py-4 text-xs font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
      No video is mapped for this lesson in {DSA_TUTOR_OPTIONS.find(option => option.key === ctx.dsaTutor)?.label}.
    </p>
  );
  return <>
    {/* ─── WORK REGION ─── */}
    <Suspense fallback={<p className="p-4 text-sm" role="status">Loading lesson workspace…</p>}>
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
    {ctx.celebrationData && <CelebrationOverlay ctx={ctx} />}
    {ctx.selectedSubCode && <SubmissionModal ctx={ctx} />}
  </>;
}
