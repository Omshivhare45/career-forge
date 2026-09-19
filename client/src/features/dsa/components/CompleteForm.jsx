import { FiCheckCircle, FiChevronRight } from 'react-icons/fi';

// Shared "Log Revision & Notes" form used by the non-coding / DevOps path.
// Mirrors the original monolithic form exactly (label "Takeaways & notes").
const CompleteForm = ({ ctx }) => {
  const {
    studyTime, setStudyTime,
    confidenceLevel, setConfidenceLevel,
    notes, setNotes,
    revisionNeeded, setRevisionNeeded,
    submitting,
    handleComplete
  } = ctx;

  return (
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
              value={studyTime}
              onChange={(e) => setStudyTime(e.target.value)}
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
                  onClick={() => setConfidenceLevel(lvl)}
                  className={"flex-1 h-7 rounded text-[10px] font-black flex items-center justify-center transition-all " + (
                    confidenceLevel === lvl
                      ? "bg-emerald-500 text-[var(--text-main)] shadow-sm"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-card)] bg-[var(--bg-card)]"
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-black text-[var(--text-light)] uppercase tracking-wider mb-1">Takeaways & notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key insights, runtime notes..."
            className="w-full p-3 bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] rounded-lg font-semibold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="revision"
            checked={revisionNeeded}
            onChange={(e) => setRevisionNeeded(e.target.checked)}
            className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] h-3.5 w-3.5 bg-[var(--bg-sub)] cursor-pointer"
          />
          <label htmlFor="revision" className="text-[10px] font-black text-[var(--text-light)] uppercase tracking-wider cursor-pointer">
            Flag this topic for scheduled revision
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-[var(--text-main)] rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? 'Submitting...' : 'Save Notes & Manual Complete'} <FiChevronRight />
        </button>
      </form>
    </div>
  );
};

export default CompleteForm;