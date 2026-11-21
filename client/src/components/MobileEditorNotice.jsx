import { FiMonitor } from 'react-icons/fi';

const MobileEditorNotice = ({ className = '' }) => (
  <div
    className={`flex h-full min-h-[220px] w-full items-center justify-center bg-[#0f0f12] p-6 text-center ${className}`}
    role="status"
    aria-label="Code editor unavailable on mobile"
  >
    <div className="max-w-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        <FiMonitor size={22} />
      </div>
      <h3 className="text-base font-black text-zinc-100">Code editor is desktop only</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Open this page on a desktop or laptop to write, run, and submit code.
      </p>
    </div>
  </div>
);

export default MobileEditorNotice;
