import { FiCheckCircle, FiYoutube } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { appendYTParams } from '../utils/dsaExecutor';

// Video rendering variants that mirror exactly how the original monolithic
// TopicDetail rendered video in each of its paths.
//   'checkpoint'     → per-checkpoint tutorial iframe + Mark Video Done
//   'lovebabbar'     → plain tutorial iframe + Mark Video Done (default course)
//   'devops'         → non-coding tutorial iframe (id: tutorial-video-iframe)
//   'striver-step1'  → full-screen black Step-1 layout with Ready For Assessment CTA
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
    isDsaDomain,
    isCompleted,
    setLearningStep
  } = ctx;

  const DEFAULT_URL = "https://www.youtube.com/embed/EAR7De6Goz4?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz";

  // ─── CHECKPOINT MODULE VIDEO ───────────────────────────────────────────────
  if (variant === 'checkpoint') {
    const cpVideoUrl = checkpointVideoEmbedUrl;
    if (!cpVideoUrl) return null;
    return (
      <div className="p-5 space-y-4 border-b border-[var(--border)]">
        <div className="aspect-video bg-[var(--bg-sub)] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
          <iframe
            key={`video-${activeCheckpoint}-${selectedLang}`}
            id={`checkpoint-video-${activeCheckpoint}`}
            className="w-full h-full"
            src={cpVideoUrl ? appendYTParams(cpVideoUrl) : ""}
            title={`${CHECKPOINT_LABELS[activeCheckpoint]} Tutorial`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Post-video state indicator */}
        {!checkpointVideoFinished && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Watch the tutorial, then complete the challenge.
            </span>
            <button
              type="button"
              onClick={() => { setCheckpointVideoFinished(true); toast.success('Video done! Now try it yourself 🚀'); }}
              className="text-[10px] bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--border)] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              Mark Video Done
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── LOVE BABBAR / DEFAULT COURSE TUTORIAL ─────────────────────────────────
  if (variant === 'lovebabbar') {
    if (!langContent?.youtubeVideoId) return null;
    return (
      <div className="p-5 space-y-4 border-b border-[var(--border)]">
        <div className="aspect-video bg-[var(--bg-sub)] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
          <iframe
            className="w-full h-full"
            src={appendYTParams(`https://www.youtube.com/embed/${langContent.youtubeVideoId}?rel=0&modestbranding=1&showinfo=0`)}
            title={topic?.title || "Video Tutorial"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {!isVideoFinished && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Watch the tutorial, then complete the challenge.
            </span>
            <button
              type="button"
              onClick={() => { setIsVideoFinished(true); toast.success('Video done! Now try it yourself 🚀'); }}
              className="text-[10px] bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--border)] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              Mark Video Done
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── NON-CODING (DEVOPS) TUTORIAL ──────────────────────────────────────────
  if (variant === 'devops') {
    if (!activeVideoEmbedUrl) return null;
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden border border-[var(--border)] shadow-lg mb-6 max-w-4xl mx-auto w-full">
        <iframe
          id="tutorial-video-iframe"
          src={appendYTParams(activeVideoEmbedUrl || DEFAULT_URL)}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  // ─── STRIVER STEP-1 (GUIDED TUTORIAL LAYOUT) ──────────────────────────────
  if (variant === 'striver-step1') {
    return (
      <div className="flex-1 flex flex-col bg-[#18181b] relative w-full h-full">
        <div className="shrink-0 bg-black aspect-video relative border-b border-[#2e2e2e]">
          <iframe
            id="tutorial-video-iframe"
            src={appendYTParams(activeVideoEmbedUrl || DEFAULT_URL)}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <div className="p-4 flex flex-col xl:flex-row xl:items-start justify-between gap-4 flex-1">
          <div className="space-y-1">
            <h2 className="text-white text-lg font-bold">{topic?.title || "Coding Foundations"}</h2>
            <div className="flex items-center gap-2">
              <div className="text-[10px] uppercase tracking-widest font-bold text-indigo-500">Video Tutorial</div>
              <span className="text-zinc-600 text-[10px]">•</span>
              <p className="text-zinc-400 text-xs">Learn the core concepts before practicing.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isDsaDomain && !isCompleted && !isVideoFinished) {
                toast.error("Please watch the video tutorial to unlock the assessment!");
                return;
              }
              setLearningStep('transition');
            }}
            className={`font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 text-sm shrink-0 flex items-center justify-center gap-2 ${
              isDsaDomain && !isCompleted && !isVideoFinished
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
            }`}
          >
            <FiCheckCircle size={16} />
            Ready For Assessment
          </button>
        </div>
      </div>
    );
  }

  // ─── STRIVER STEP-2 EMBED (Dynamic Lecture Video card) ────────────────────
  if (variant === 'embed') {
    if (!langContent?.youtubeVideoId) return null;
    return (
      <div className="space-y-2 mb-4">
        <h3 className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
          <FiYoutube className="text-red-500" /> Dynamic Lecture Video
        </h3>
        <div className="aspect-video bg-[var(--bg-sub)] shadow-sm rounded-xl overflow-hidden border border-[var(--border)]">
          <iframe
            className="w-full h-full"
            src={appendYTParams(`https://www.youtube.com/embed/${langContent.youtubeVideoId}?rel=0&modestbranding=1&showinfo=0`)}
            title={topic?.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  }

  return null;
};