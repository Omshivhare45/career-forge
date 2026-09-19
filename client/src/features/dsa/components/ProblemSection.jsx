import { Link } from 'react-router-dom';
import {
  FiCheckCircle, FiCode, FiArrowRight, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import CompleteForm from './CompleteForm';
import DifficultyLadder from './DifficultyLadder';
import ApproachGuide from './ApproachGuide';
import SubmissionsList from './SubmissionsList';
import { VideoPlayer } from './VideoPlayer';

// Unified left-pane content renderer. `variant` selects which path of the
// original monolithic render to execute.
const ProblemSection = ({ ctx, variant }) => {
  const {
    topic,
    isCompleted,
    nextTopic,
    isVideoFinished,
    langContent,
    activeCheckpointContent,
    completedCheckpoints,
    activeCheckpoint,
    CHECKPOINT_LABELS,
    checkpointVideoFinished,
    checkpointCodePassed,
    isLastCp,
    markCheckpointComplete,
    setCheckpointCodePassed,
    setEditorCode,
    setCompilerStatus,
    setTestResults,
    setConsoleLogs,
    isDsaDomain,
    dsaCourse,
    learningStep,
    setLearningStep,
    activeDifficulty,
    useStriverAdvanced,
    setUseStriverAdvanced,
    leftTab,
    submissions,
    setSelectedSubCode,
    triggerConfettiExplosion,
    handleSubmitCode,
    handleComplete,
    activeDomainProgress,
    id,
    navigate,
    handleGamificationUpdate,
    refreshUser
  } = ctx;

  // ─── CHECKPOINT MODULE CHALLENGE ───────────────────────────────────────────
  if (variant === 'checkpoint') {
    const cpContent = activeCheckpointContent;
    if (!cpContent) return null;
    return (
      <div className="p-5 space-y-4">
        {/* "Now try this yourself" motivating header */}
        {checkpointVideoFinished && (
          <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl space-y-1">
            <div className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
              <span>💡</span> Now try this yourself!
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-semibold leading-relaxed">
              You just watched the concept. Now it's your turn to write the code. Read the problem, think through the logic, and hit Run Code on the right.
            </p>
          </div>
        )}

        {/* Challenge title */}
        {cpContent.challengeTitle && (
          <div className="flex items-center gap-2">
            <FiCode className="text-[var(--primary)] text-sm" />
            <span className="text-sm font-black text-[var(--text-main)]">{cpContent.challengeTitle}</span>
          </div>
        )}

        {/* Problem statement */}
        <div className="p-4 bg-[var(--bg-sub)] rounded-xl border border-[var(--border)] space-y-2">
          <div className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider">Problem</div>
          <p className="text-xs text-[var(--text-muted)] font-semibold leading-relaxed whitespace-pre-line">
            {cpContent.challengeDescription}
          </p>
        </div>

        {/* Constraints */}
        {cpContent.constraints && cpContent.constraints !== 'None' && cpContent.constraints !== 'None — just return the exact string.' ? (
          <div className="p-3 bg-[var(--bg-sub)] rounded-xl border border-[var(--border)]">
            <div className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider mb-1">Constraints</div>
            <div className="font-mono text-[10px] text-[var(--text-main)]">{cpContent.constraints}</div>
          </div>
        ) : null}

        {/* Sample test cases */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-black text-[var(--text-main)] flex items-center gap-1.5">
            📋 Sample Test Cases
          </div>
          {cpContent.testCases.slice(0, 2).map((tc, tidx) => (
            <div key={tidx} className="p-3 bg-[var(--bg-sub)] rounded-lg border border-[var(--border)] font-mono text-[10px] flex items-center gap-3">
              <div className="text-[var(--text-muted)]">
                Input: <span className="text-[var(--text-main)] font-black">{tc.input || '(no input)'}</span>
              </div>
              <div className="text-[var(--text-light)]">→</div>
              <div className="text-[var(--text-muted)]">
                Expected: <span className="text-emerald-400 font-black">{tc.expected}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Hints */}
        {cpContent.hints && cpContent.hints.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-black text-[var(--text-main)]">💡 Hints (open if stuck)</div>
            {cpContent.hints.map((hint, hidx) => (
              <details key={hidx} className="group border border-[var(--border)] bg-[var(--bg-sub)] rounded-lg px-3 py-2 cursor-pointer">
                <summary className="text-[10px] font-bold text-[var(--text-main)] flex items-center justify-between select-none">
                  <span>Hint {hidx + 1}</span>
                  <span className="text-[var(--text-light)] group-open:rotate-180 transition-transform text-xs">▼</span>
                </summary>
                <p className="mt-2 text-[10px] text-[var(--text-muted)] font-semibold leading-relaxed">{hint}</p>
              </details>
            ))}
          </div>
        )}

        {/* Complete checkpoint button */}
        <button
          onClick={() => {
            if (!checkpointVideoFinished) {
              toast.error('Watch the video first! Click "Mark Done" when finished. 🎬');
              return;
            }
            if (!checkpointCodePassed) {
              toast.error('Pass all test cases first! Write your code and click Run Code. ⚡');
              return;
            }
            markCheckpointComplete(activeCheckpoint);
            setCheckpointCodePassed(false);
            setEditorCode('');
            setCompilerStatus('idle');
            setTestResults([]);
            setConsoleLogs([]);
          }}
          disabled={!checkpointVideoFinished || !checkpointCodePassed}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 mt-2 ${
            !checkpointVideoFinished || !checkpointCodePassed
              ? 'bg-[var(--border-light)] text-[var(--text-light)] cursor-not-allowed border border-[var(--border)]'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-[var(--text-main)] shadow-lg shadow-emerald-500/25 cursor-pointer hover:scale-[1.01]'
          }`}
        >
          {completedCheckpoints.includes(activeCheckpoint) ? (
            <><FiCheckCircle /> Checkpoint Done!</>
          ) : !checkpointVideoFinished ? (
            <>🔒 Watch the Video First</>
          ) : !checkpointCodePassed ? (
            <>⚡ Pass All Tests to Unlock</>
          ) : isLastCp ? (
            <>🏆 Complete {topic?.title || 'Level 0'}!</>
          ) : (
            <>✅ Complete & Unlock Next →</>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.confirm("Are you sure you want to skip this checkpoint challenge and mark it as completed?")) {
              markCheckpointComplete(activeCheckpoint);
              setCheckpointVideoFinished(false);
              setCheckpointCodePassed(false);
              setEditorCode('');
              setCompilerStatus('idle');
              setTestResults([]);
              setConsoleLogs([]);
              toast.success('Checkpoint skipped and marked as complete! 🚀');
            }
          }}
          className="w-full py-2 bg-transparent border border-dashed border-[var(--border)] hover:border-zinc-500 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          ⏭️ Skip &amp; Complete Checkpoint
        </button>
      </div>
    );
  }

  // ─── LOVE BABBAR / DEFAULT COURSE CHALLENGE ────────────────────────────────
  if (variant === 'lovebabbar') {
    return (
      <div className="p-5 space-y-4">
        {isVideoFinished && (
          <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl space-y-1">
            <div className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
              <span>💡</span> Now try this yourself!
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-semibold leading-relaxed">
              You just watched the concept. Now it's your turn to write the code. Read the problem, think through the logic, and hit Run Code on the right.
            </p>
          </div>
        )}

        {topic?.title && (
          <div className="flex items-center gap-2">
            <FiCode className="text-[var(--primary)] text-sm" />
            <span className="text-sm font-black text-[var(--text-main)]">{topic.title}</span>
          </div>
        )}

        <div className="p-4 bg-[var(--bg-sub)] rounded-xl border border-[var(--border)] space-y-2">
          <div className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider">Problem</div>
          <p className="text-xs text-[var(--text-muted)] font-semibold leading-relaxed whitespace-pre-line">
            {langContent?.challengeDescription || (topic && topic.description)}
          </p>
        </div>

        {langContent?.constraints && langContent.constraints !== 'None' && langContent.constraints !== 'None — just return the exact string.' && (
          <div className="p-3 bg-[var(--bg-sub)] rounded-xl border border-[var(--border)]">
            <div className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider mb-1">Constraints</div>
            <div className="font-mono text-[10px] text-[var(--text-main)]">{langContent.constraints}</div>
          </div>
        )}

        {langContent?.testCases?.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-black text-[var(--text-main)] flex items-center gap-1.5">
              📋 Sample Test Cases
            </div>
            {langContent.testCases.slice(0, 2).map((tc, tidx) => (
              <div key={tidx} className="p-3 bg-[var(--bg-sub)] rounded-lg border border-[var(--border)] font-mono text-[10px] flex items-center gap-3">
                <div className="text-[var(--text-muted)]">
                  Input: <span className="text-[var(--text-main)] font-black">{tc.input || '(no input)'}</span>
                </div>
                <div className="text-[var(--text-light)]">→</div>
                <div className="text-[var(--text-muted)]">
                  Expected: <span className="text-emerald-400 font-black">{tc.expected}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {langContent?.hints?.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-black text-[var(--text-main)]">💡 Hints (open if stuck)</div>
            {langContent.hints.map((hint, hidx) => (
              <details key={hidx} className="group border border-[var(--border)] bg-[var(--bg-sub)] rounded-lg px-3 py-2 cursor-pointer">
                <summary className="text-[10px] font-bold text-[var(--text-main)] flex items-center justify-between select-none">
                  <span>Hint {hidx + 1}</span>
                  <span className="text-[var(--text-light)] group-open:rotate-180 transition-transform text-xs">▼</span>
                </summary>
                <p className="mt-2 text-[10px] text-[var(--text-muted)] font-semibold leading-relaxed">{hint}</p>
              </details>
            ))}
          </div>
        )}

        {/* Complete Topic button */}
        <button
          onClick={(e) => {
            if (!isVideoFinished) {
              toast.error('Watch the video first! Click "Mark Done" when finished. 🎬');
              return;
            }
            handleComplete(e);
          }}
          disabled={!isVideoFinished}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 mt-2 ${
            !isVideoFinished
              ? 'bg-[var(--border-light)] text-[var(--text-light)] cursor-not-allowed border border-[var(--border)]'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-[var(--text-main)] shadow-lg shadow-emerald-500/25 cursor-pointer hover:scale-[1.01]'
          }`}
        >
          {isCompleted ? (
            <><FiCheckCircle /> Completed!</>
          ) : !isVideoFinished ? (
            <>🔒 Watch the Video First</>
          ) : (
            <>Submit & Complete</>
          )}
        </button>
      </div>
    );
  }

  // ─── STRIVER TRANSITION OVERLAY ────────────────────────────────────────────
  if (variant === 'striver-transition') {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 select-text w-full h-full absolute inset-0 z-[100]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`max-w-md w-full rounded-3xl p-8 space-y-6 shadow-2xl border ${
            'bg-white border-slate-200 dark:bg-zinc-950 dark:border-zinc-800'
          }`}
        >
          <div className="text-center space-y-2">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Tutorial Completed</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              Great job completing the {topic?.title || 'Coding Foundations'} tutorial!
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4 border border-slate-100 dark:border-zinc-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Topics Covered</div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-zinc-300">
              <FiCheckCircle size={16} className="text-emerald-500" /> Basic Syntax
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-zinc-300">
              <FiCheckCircle size={16} className="text-emerald-500" /> Structure & Logic
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-zinc-300">
              <FiCheckCircle size={16} className="text-emerald-500" /> Hands-on Example
            </div>
          </div>

          <button
            onClick={() => {
              setLearningStep(2);
              ctx.setLeftTab('description');
              toast.success('Mini Assessment Unlocked! 🚀');
            }}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Start Assessment
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── DEVOPS / NON-CODING PATH ─────────────────────────────────────────────
  if (variant === 'noncoding') {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg-card)]">
        {/* Topic Info */}
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">{topic?.title}</h2>
              <div className="text-[10px] font-black text-[var(--text-light)] uppercase tracking-wider mt-1">
                Difficulty: <span className="text-[var(--primary)]">{topic?.difficulty || 'Beginner'}</span> • Duration: {topic?.estimatedTime || '1 hour'}
              </div>
              {isDsaDomain && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Instructor:</span>
                  <button
                    onClick={() => setUseStriverAdvanced(false)}
                    className={`px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-wider transition-colors ${!useStriverAdvanced ? 'bg-[var(--primary)] text-[var(--text-main)] border-[var(--primary)]' : 'bg-[var(--bg-sub)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)]'}`}
                  >
                    Love Babbar
                  </button>
                  <button
                    onClick={() => setUseStriverAdvanced(true)}
                    className={`px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-wider transition-colors ${useStriverAdvanced ? 'bg-[var(--primary)] text-[var(--text-main)] border-[var(--primary)]' : 'bg-[var(--bg-sub)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)]'}`}
                  >
                    Striver A2Z
                  </button>
                </div>
              )}
            </div>
            {isCompleted && (
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-black flex items-center gap-1.5 animate-bounce-subtle">
                <FiCheckCircle /> Completed
              </div>
            )}
          </div>

          <div className="prose dark:prose-invert max-w-none text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-line bg-[var(--bg-sub)] p-4 rounded-xl border border-[var(--border)] font-semibold">
            {topic?.description}
          </div>

          <CompleteForm ctx={ctx} />
        </div>
      </div>
    );
  }

  // ─── STRIVER STEP-2 TAB CONTENT ────────────────────────────────────────────
  if (variant === 'striver-description') {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Meta details header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-lg font-black text-[var(--text-main)] tracking-tight">
              {topic?.title}
            </h2>
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                  (topic?.difficulty || 'medium').toLowerCase() === 'easy'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : (topic?.difficulty || 'medium').toLowerCase() === 'hard'
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {topic?.difficulty || 'Medium'}
                </span>
                <span className="text-[9px] font-bold text-[var(--text-light)] uppercase tracking-wider">
                  Est. {topic?.estimatedTime || '15 mins'}
                </span>
              </div>

              {isDsaDomain && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Instructor:</span>
                  <button
                    onClick={() => setUseStriverAdvanced(false)}
                    className={`px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-wider transition-colors ${!useStriverAdvanced ? 'bg-[var(--primary)] text-[var(--text-main)] border-[var(--primary)]' : 'bg-[var(--bg-sub)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)]'}`}
                  >
                    Love Babbar
                  </button>
                  <button
                    onClick={() => setUseStriverAdvanced(true)}
                    className={`px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-wider transition-colors ${useStriverAdvanced ? 'bg-[var(--primary)] text-[var(--text-main)] border-[var(--primary)]' : 'bg-[var(--bg-sub)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)]'}`}
                  >
                    Striver A2Z
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DifficultyLadder ctx={ctx} />
        <VideoPlayer ctx={ctx} variant="embed" />

        {/* Challenge description Panel */}
        <div className="prose dark:prose-invert max-w-none text-xs text-[var(--text-muted)] leading-relaxed font-semibold p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-sub)]">
          <div className="text-[10px] font-black text-[var(--text-light)] uppercase tracking-wider mb-2">Problem Statement</div>
          <p className="whitespace-pre-line leading-relaxed">
            {langContent?.challengeDescription || (topic && topic.description)}
          </p>
        </div>

        {langContent?.constraints && (
          <div className="p-4 bg-[var(--bg-sub)] rounded-xl border border-[var(--border)] text-xs">
            <div className="text-[10px] font-black text-[var(--text-light)] uppercase tracking-wider mb-2">Constraints</div>
            <div className="font-mono text-[10px] text-[var(--text-main)]">{langContent.constraints}</div>
          </div>
        )}

        {langContent?.hints && langContent.hints.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
              💡 Dynamic Clues & Hints
            </h3>
            <div className="space-y-1.5">
              {langContent.hints.map((hint, hidx) => (
                <details key={hidx} className="group border border-[var(--border)] bg-[var(--bg-sub)] rounded-lg p-2.5 transition-all text-xs">
                  <summary className="font-bold text-[10px] text-[var(--text-main)] cursor-pointer select-none flex items-center justify-between">
                    <span>Clue {hidx + 1}</span>
                    <span className="text-[var(--text-light)] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-2 text-[10px] text-[var(--text-muted)] font-medium leading-relaxed">
                    {hint}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Completion Banners */}
        {isCompleted && nextTopic && (
          <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-md shadow-emerald-500/5 animate-fade-in">
            <div className="w-12 h-12 bg-emerald-500 text-[var(--text-main)] rounded-full flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
              🎉
            </div>
            <div>
              <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Quest Accomplished!</h4>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-1">
                You have successfully unlocked the next topic in this expedition:
              </p>
              <div className="text-xs font-black text-emerald-500 mt-1.5 uppercase tracking-tight">
                {nextTopic.title}
              </div>
            </div>
             <Link
              to={`/topic/${nextTopic._id}`}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-[var(--text-main)] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 group cursor-pointer hover:scale-105 duration-300 animate-pulse"
            >
              Unlock Next Topic <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {isCompleted && !nextTopic && (
          <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-md shadow-amber-500/5 animate-fade-in">
            <div className="w-12 h-12 bg-amber-500 text-[var(--text-main)] rounded-full flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
              🏆
            </div>
            <div>
              <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Phase Mastered!</h4>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-1">
                Outstanding! You have conquered every single topic in this active phase.
              </p>
            </div>
            <Link
              to="/roadmap"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-[var(--text-main)] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 group cursor-pointer hover:scale-105 duration-300"
            >
              Go to Roadmap <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        <div className="card p-5 border-emerald-500/20 border-t-2 space-y-4">
          <h3 className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
            <FiCheckCircle className="text-emerald-500" /> Log Revision & Notes
          </h3>
          <form onSubmit={handleComplete} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider mb-1">Study Duration (mins)</label>
                <input
                  type="number"
                  value={ctx.studyTime}
                  onChange={(e) => ctx.setStudyTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] rounded-lg font-bold focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider mb-1">Confidence standing</label>
                <div className="flex gap-1 bg-[var(--bg-sub)] border border-[var(--border)] p-1 rounded-lg">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => ctx.setConfidenceLevel(lvl)}
                      className={`flex-1 h-7 rounded text-[10px] font-black flex items-center justify-center transition-all ${
                        ctx.confidenceLevel === lvl
                          ? 'bg-emerald-500 text-[var(--text-main)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] bg-[var(--bg-card)]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider mb-1">Algorithmic findings / takeaways</label>
              <textarea
                rows={2}
                value={ctx.notes}
                onChange={(e) => ctx.setNotes(e.target.value)}
                placeholder="Key insights, runtime notes..."
                className="w-full p-3 bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] rounded-lg font-semibold focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="revision"
                checked={ctx.revisionNeeded}
                onChange={(e) => ctx.setRevisionNeeded(e.target.checked)}
                className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] h-3.5 w-3.5 bg-[var(--bg-sub)] cursor-pointer"
              />
              <label htmlFor="revision" className="text-[10px] font-black text-[var(--text-light)] uppercase tracking-wider cursor-pointer">
                Flag this topic for scheduled revision
              </label>
            </div>

            <button
              type="submit"
              disabled={ctx.submitting}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-[var(--text-main)] rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {ctx.submitting ? 'Submitting...' : 'Save Notes & Manual Complete'} <FiChevronRight />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (variant === 'striver-approach') return <ApproachGuide ctx={ctx} />;
  if (variant === 'striver-submissions') return <SubmissionsList ctx={ctx} />;

  return null;
};

export default ProblemSection;