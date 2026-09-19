
// Submissions historical details modal — shows status, stats, and source code.
export const SubmissionModal = ({ ctx }) => {
  const { selectedSubCode, setSelectedSubCode, handleLoadSubmission, id } = ctx;

  if (!selectedSubCode) return null;

  const isAccepted = selectedSubCode.status === 'Accepted';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-sub)]">
          <div>
            <h3 className="font-black text-xs text-[var(--text-main)] flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                isAccepted
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {selectedSubCode.status}
              </span>
              Submission Details
            </h3>
            <p className="text-[9px] text-[var(--text-light)] font-black uppercase mt-0.5">
              {selectedSubCode.language === 'cpp' ? 'C++' : selectedSubCode.language === 'javascript' ? 'JS' : selectedSubCode.language} • {new Date(selectedSubCode.submittedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setSelectedSubCode(null)}
            className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-4 text-center">
            <div className="flex-1 p-3 bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl">
              <div className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-wider mb-0.5">Test Cases Passed</div>
              <span className="text-[var(--text-main)] font-black text-sm">{selectedSubCode.passedCount} / {selectedSubCode.totalCount}</span>
            </div>
            <div className="flex-1 p-3 bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl">
              <div className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-wider mb-0.5">Execution Speed</div>
              <span className="text-[var(--text-main)] font-black text-sm">{selectedSubCode.runtime} ms</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider">
              <span>Source Code</span>
              <button
                onClick={() => {
                  handleLoadSubmission(selectedSubCode.code, selectedSubCode.language);
                  setSelectedSubCode(null);
                }}
                className="px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--text-main)] rounded border border-[var(--primary)]/10 transition-all font-black text-[8px] uppercase tracking-wider cursor-pointer"
              >
                Load into Playground
              </button>
            </div>
            <pre className="p-4 rounded-xl border border-[var(--border)] bg-[#0f172a] text-slate-100 font-mono text-[10px] overflow-x-auto shadow-inner leading-relaxed max-h-[300px] select-text">
              <code>{selectedSubCode.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};