import { FiBookOpen, FiZap, FiCheckCircle, FiBook, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Striver A2Z stepper + Description / Solution Guide / Submissions tabs header.
// Rendered above the left pane scroll content for the Striver course (Step 2+).
const StepperBar = ({ ctx }) => {
  const {
    learningStep, setLearningStep,
    isCompleted,
    isVideoFinished,
    leftTab, setLeftTab,
    submissions
  } = ctx;

  return (
    <div className="bg-[var(--bg-sub)] border-b border-[var(--border)] px-4 py-2 flex flex-col shrink-0 gap-2">
      {/* Top Stepper Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { step: 1, label: '1. Watch & Code' },
            { step: 2, label: '2. Mini Assessment' }
          ].map(s => {
            const isLocked = s.step === 2 && !isCompleted && !isVideoFinished;
            return (
              <button
                key={s.step}
                onClick={() => {
                  if (isLocked) {
                    toast.error("Please watch the video tutorial to unlock the assessment!");
                    return;
                  }
                  setLearningStep(s.step);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                  learningStep === s.step
                    ? 'bg-[var(--bg-card)] text-[var(--primary)] border border-[var(--border)] shadow-sm'
                    : !isLocked
                      ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-transparent cursor-pointer hover:bg-[var(--primary)] hover:text-[var(--text-main)]'
                      : 'text-[var(--text-muted)] opacity-50 cursor-pointer'
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${learningStep > s.step || (s.step === 2 && isCompleted) ? 'bg-[var(--primary)] text-[var(--text-main)]' : 'border border-current'}`}>
                  {learningStep > s.step || (s.step === 2 && isCompleted) ? <FiCheckCircle size={8} /> : s.step}
                </div>
                {s.label}
              </button>
            );
          })}
        </div>

        {learningStep === 1 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-[var(--text-main)] rounded-lg text-[9px] font-black shadow-inner tracking-widest shrink-0">
            <FiBookOpen /> INTERACTIVE CLASSROOM
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-[var(--text-main)] rounded-lg text-[9px] font-black shadow-inner tracking-widest shrink-0">
            <FiZap /> +100 XP
          </div>
        )}
      </div>

      {/* Tabs (only shown on step 2) */}
      {learningStep >= 2 && (
        <div className="flex gap-1.5 mt-1.5 pt-1.5 border-t border-[var(--border)]">
          {[
            { id: 'description', label: 'Description', icon: <FiBookOpen size={12} /> },
            { id: 'approach', label: 'Solution Guide', icon: <FiBook size={12} /> },
            { id: 'submissions', label: 'Submissions', icon: <FiClock size={12} />, badge: submissions.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setLeftTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                leftTab === tab.id
                  ? 'bg-[var(--bg-card)] text-[var(--primary)] border border-[var(--border)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="w-4 h-4 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[8px] font-black flex items-center justify-center shadow-inner">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StepperBar;