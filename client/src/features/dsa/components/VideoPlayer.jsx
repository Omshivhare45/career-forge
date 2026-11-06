import { FiCheckCircle, FiYoutube } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { appendYTParams, getYouTubeEmbedUrl } from '../utils/dsaExecutor';

// Video rendering variants that mirror how TopicDetail renders video:
//   'checkpoint'     → per-checkpoint tutorial iframe + Mark Video Done
//   'lovebabbar'     → plain tutorial iframe + Mark Video Done (default course)
//   'devops'         → non-coding tutorial iframe (id: tutorial-video-iframe)
//   'striver-step1'  → full-screen black Step-1 layout with Ready For Assessment CTA
//   'workspace'      → workspace multi-video catalog player
//   'embed'          → Dynamic Lecture Video embed card (Striver Step-2 description tab)
export const VideoPlayer = ({ ctx, variant }) => {
  const {
    topic,
    selectedLang,
    activeCheckpoint,
    CHECKPOINT_LABELS,
    checkpointVideoEmbedUrl,
    checkpointVideoFinished, setCheckpointVideoFinished,
    langContent,
    isVideoFinished, setIsVideoFinished,
    activeVideoEmbedUrl,
    setLearningStep
  } = ctx;

  const DEFAULT_URL = "https://www.youtube.com/embed/EAR7De6Goz4?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz";

  // ─── CHECKPOINT MODULE VIDEO ───────────────────────────────────────────────
  if (variant === 'checkpoint') {
    const cpVideoUrl = checkpointVideoEmbedUrl;
    if (!cpVideoUrl) return null;
    const cpSrc = appendYTParams(cpVideoUrl);
    return (
      <div className="p-5 space-y-4 border-b border-[var(--border)]">
        <div className="aspect-video bg-[var(--bg-sub)] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
          <iframe
            key={`checkpoint-frame-${activeCheckpoint}-${selectedLang}-${cpSrc}`}
            id={`checkpoint-video-${activeCheckpoint}`}
            className="w-full h-full"
            src={cpSrc}
            title={`${CHECKPOINT_LABELS[activeCheckpoint]} Tutorial`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Post-video state indicator */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            {checkpointVideoFinished ? "✅ Tutorial video completed" : "Watch the tutorial or jump straight into the challenge."}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextState = !checkpointVideoFinished;
              setCheckpointVideoFinished(nextState);
              if (ctx?.id && ctx?.activeVideoKey) {
                try {
                  localStorage.setItem(`dsa_video_done_${ctx.id}_${ctx.activeVideoKey}`, nextState ? 'true' : 'false');
                } catch (e) {}
              }
              if (nextState) toast.success('Video marked done! 🚀');
            }}
            className={`text-[10px] border font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              checkpointVideoFinished
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-[var(--bg-sub)] border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--border)]'
            }`}
          >
            {checkpointVideoFinished ? '✓ Video Done' : 'Mark Video Done'}
          </button>
        </div>
      </div>
    );
  }

  // ─── LOVE BABBAR / DEFAULT COURSE TUTORIAL ─────────────────────────────────
  if (variant === 'lovebabbar') {
    if (!langContent?.youtubeVideoId) return null;
    const embedUrl = getYouTubeEmbedUrl(langContent.youtubeVideoId) || `https://www.youtube.com/embed/${langContent.youtubeVideoId}`;
    const embedSrc = appendYTParams(embedUrl);
    return (
      <div className="p-5 space-y-4 border-b border-[var(--border)]">
        <div className="aspect-video bg-[var(--bg-sub)] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
          <iframe
            key={`tutorial-frame-${ctx?.activeVideoKey || 'default'}-${selectedLang}-${embedSrc}-${ctx?.learningStep ?? ''}`}
            id="tutorial-video-iframe"
            className="w-full h-full"
            src={embedSrc}
            title={topic?.title || "Video Tutorial"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            {isVideoFinished ? "✅ Tutorial video completed" : "Watch the tutorial, or start coding directly."}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextState = !isVideoFinished;
              setIsVideoFinished(nextState);
              if (nextState) toast.success('Video marked done! 🚀');
            }}
            className={`text-[10px] border font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              isVideoFinished
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-[var(--bg-sub)] border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--border)]'
            }`}
          >
            {isVideoFinished ? '✓ Video Done' : 'Mark Video Done'}
          </button>
        </div>
      </div>
    );
  }

  // ─── NON-CODING (DEVOPS) TUTORIAL ──────────────────────────────────────────
  if (variant === 'devops') {
    if (!activeVideoEmbedUrl) return null;
    const devopsSrc = appendYTParams(activeVideoEmbedUrl || DEFAULT_URL);
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden border border-[var(--border)] shadow-lg mb-6 max-w-4xl mx-auto w-full">
        <iframe
          key={`tutorial-frame-${ctx?.activeVideoKey || 'default'}-${selectedLang}-${devopsSrc}-${ctx?.learningStep ?? ''}`}
          id="tutorial-video-iframe"
          src={devopsSrc}
          className="w-full h-full"
          title={topic?.title || "Tutorial"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  // ─── WORKSPACE TUTORIAL (catalog-driven multi-video DSA player) ───────────
  if (variant === 'workspace') {
    if (!activeVideoEmbedUrl) return null;
    const workspaceSrc = appendYTParams(activeVideoEmbedUrl);
    return (
      <div className="p-5 space-y-4 border-b border-[var(--border)]">
        <div className="aspect-video bg-[var(--bg-sub)] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
          <iframe
            key={`tutorial-frame-${ctx?.activeVideoKey || 'default'}-${selectedLang}-${workspaceSrc}-${ctx?.learningStep ?? ''}`}
            id="tutorial-video-iframe"
            className="w-full h-full"
            src={workspaceSrc}
            title={topic?.title || "Video Tutorial"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            {isVideoFinished ? "✅ Tutorial video completed" : "Watch the tutorial, or start coding directly."}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextState = !isVideoFinished;
              setIsVideoFinished(nextState);
              if (ctx?.id && ctx?.activeVideoKey) {
                try {
                  localStorage.setItem(`dsa_video_done_${ctx.id}_${ctx.activeVideoKey}`, nextState ? 'true' : 'false');
                } catch (e) {}
              }
              if (nextState) toast.success('Video marked done! 🚀');
            }}
            className={`text-[10px] border font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              isVideoFinished
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-[var(--bg-sub)] border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--border)]'
            }`}
          >
            {isVideoFinished ? '✓ Video Done' : 'Mark Video Done'}
          </button>
        </div>
      </div>
    );
  }

  // ─── STRIVER STEP-1 (GUIDED TUTORIAL LAYOUT) ──────────────────────────────
  if (variant === 'striver-step1') {
    const step1Src = appendYTParams(activeVideoEmbedUrl || DEFAULT_URL);
    return (
      <div className="flex-1 flex flex-col bg-[#18181b] relative w-full h-full">
        <div className="shrink-0 bg-black aspect-video relative border-b border-[#2e2e2e]">
          <iframe
            key={`tutorial-frame-${ctx?.activeVideoKey || 'default'}-${selectedLang}-${step1Src}-${ctx?.learningStep ?? ''}`}
            id="tutorial-video-iframe"
            src={step1Src}
            className="w-full h-full"
            title={topic?.title || "Video Tutorial"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1">
          <div className="space-y-1">
            <h2 className="text-white text-lg font-bold">{topic?.title || "Coding Foundations"}</h2>
            <div className="flex items-center gap-2">
              <div className="text-[10px] uppercase tracking-widest font-bold text-indigo-500">Video Tutorial</div>
              <span className="text-zinc-600 text-[10px]">•</span>
              <p className="text-zinc-400 text-xs">Learn the core concepts, or jump straight into practice.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextState = !isVideoFinished;
                setIsVideoFinished(nextState);
                if (nextState) toast.success('Video marked done! 🚀');
              }}
              className={`text-xs border font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isVideoFinished
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {isVideoFinished ? '✓ Video Done' : 'Mark Video Done'}
            </button>
            <button
              onClick={() => {
                setIsVideoFinished(true);
                setLearningStep('transition');
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiCheckCircle size={16} />
              Ready For Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STRIVER STEP-2 EMBED (Dynamic Lecture Video card) ────────────────────
  if (variant === 'embed') {
    if (!langContent?.youtubeVideoId) return null;
    const embedUrl = getYouTubeEmbedUrl(langContent.youtubeVideoId) || `https://www.youtube.com/embed/${langContent.youtubeVideoId}`;
    return (
      <div className="space-y-2 mb-4">
        <h3 className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
          <FiYoutube className="text-red-500" /> Dynamic Lecture Video
        </h3>
        <div className="aspect-video bg-[var(--bg-sub)] shadow-sm rounded-xl overflow-hidden border border-[var(--border)]">
          <iframe
            className="w-full h-full"
            src={appendYTParams(embedUrl)}
            title={topic?.title || "Dynamic Lecture Video"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  }

  return null;
};