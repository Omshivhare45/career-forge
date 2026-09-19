import { FiBook, FiCode } from 'react-icons/fi';

// Striver "Solution Guide" tab — concept approach + optimal solution reference.
const ApproachGuide = ({ ctx }) => {
  const { topic, langContent } = ctx;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center border-b border-[var(--border)] pb-2.5">
        <h3 className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
          <FiBook className="text-amber-500" /> Concept Approach
        </h3>
        <span className="text-[8px] font-bold text-[var(--text-light)] uppercase tracking-wider">Hinglish Mentorship Guide</span>
      </div>

      <p className="text-[11px] text-[var(--text-muted)] font-semibold whitespace-pre-line leading-relaxed bg-[var(--bg-sub)] p-4 rounded-xl border border-[var(--border)]">
        {langContent?.approach || topic?.description || 'Optimal concept guide loading...'}
      </p>

      {langContent && (
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
            <FiCode className="text-emerald-500" /> Optimal Solution Reference
          </h3>

          <pre className="p-3.5 rounded-xl border border-[var(--border)] bg-[#0f172a] text-emerald-400 font-mono text-[10px] overflow-x-auto shadow-inner leading-relaxed select-text">
            <code>{langContent.code}</code>
          </pre>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl text-center">
              <div className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-wider mb-0.5">Time Complexity</div>
              <span className="text-emerald-500 font-black text-xs font-mono">{langContent.timeComplexity}</span>
            </div>
            <div className="p-3 bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl text-center">
              <div className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-wider mb-0.5">Space Complexity</div>
              <span className="text-emerald-500 font-black text-xs font-mono">{langContent.spaceComplexity}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproachGuide;