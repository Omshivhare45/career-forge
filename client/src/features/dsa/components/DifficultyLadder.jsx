
// Striver progressive difficulty progression ladder (beginner → easy → medium → challenge).
const DifficultyLadder = ({ ctx }) => {
  const { id, activeDifficulty, setActiveDifficulty } = ctx;

  return (
    <div className="bg-[var(--bg-sub)] p-4 rounded-xl border border-[var(--border)] space-y-3">
      <div className="text-[10px] font-black text-[var(--text-light)] uppercase tracking-wider flex items-center justify-between">
        <span>Topic Progression Ladder</span>
        <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
          Rank: {activeDifficulty.toUpperCase()}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {['beginner', 'easy', 'medium', 'challenge'].map((diff, idx) => {
          const isUnlocked = idx === 0 || localStorage.getItem(`dsa_completed_${id}_${['beginner', 'easy', 'medium', 'challenge'][idx - 1]}`) === 'true';
          const isCompleted = localStorage.getItem(`dsa_completed_${id}_${diff}`) === 'true';
          const isActive = activeDifficulty === diff;

          return (
            <button
              key={diff}
              disabled={!isUnlocked}
              onClick={() => setActiveDifficulty(diff)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all relative ${
                isActive
                  ? 'bg-[var(--bg-card)] border-[var(--primary)] shadow-sm ring-1 ring-[var(--primary)] text-[var(--primary)]'
                  : isUnlocked
                    ? 'hover:bg-[var(--bg-card)] border-[var(--border)] cursor-pointer text-[var(--text-main)]'
                    : 'opacity-40 cursor-not-allowed border-dashed bg-[var(--bg-sub)]/10 text-[var(--text-muted)]'
              }`}
            >
              <div className={`text-[8px] font-black uppercase tracking-wider mb-1 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                {diff}
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                isCompleted
                  ? 'bg-emerald-500 text-[var(--text-main)] shadow'
                  : isActive
                    ? 'bg-[var(--primary)] text-[var(--text-main)] shadow'
                    : 'bg-[var(--bg-sub)] text-[var(--text-light)] border border-[var(--border)]'
              }`}>
                {isCompleted ? '✓' : idx + 1}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultyLadder;