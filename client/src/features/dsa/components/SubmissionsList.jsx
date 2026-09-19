import { FiClock, FiTerminal } from 'react-icons/fi';

// Striver "Submissions" tab — historical submission log list.
const SubmissionsList = ({ ctx }) => {
  const { submissions, setSelectedSubCode } = ctx;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="border-b border-[var(--border)] pb-2.5">
        <h3 className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
          <FiClock className="text-purple-500" /> Submission Logs
        </h3>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-light)]">
          <FiTerminal className="mx-auto text-3xl mb-3 text-[var(--text-muted)] animate-pulse" />
          <p className="text-xs font-bold">No submissions yet.</p>
          <p className="text-[9px] mt-1">Develop code and click "Submit Code" to save history!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {submissions.map((sub, idx) => {
            const isAccepted = sub.status === 'Accepted';
            const isRuntimeErr = sub.status === 'Runtime Error';
            return (
              <div key={sub._id || idx} className="p-3 bg-[var(--bg-sub)] rounded-xl border border-[var(--border)] flex justify-between items-center hover:border-[var(--primary)] transition-all">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      isAccepted
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : isRuntimeErr
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}>
                      {sub.status}
                    </span>
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase">
                      {sub.language === 'cpp' ? 'C++' : sub.language === 'javascript' ? 'JS' : sub.language}
                    </span>
                  </div>
                  <div className="text-[9px] font-bold text-[var(--text-light)] mt-0.5">
                    {new Date(sub.submittedAt).toLocaleString()} • {sub.runtime} ms
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSubCode(sub)}
                  className="px-2.5 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] border border-[var(--border)] rounded-lg text-[9px] font-black uppercase transition-all shadow-sm shrink-0"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubmissionsList;