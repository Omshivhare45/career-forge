import { FiList, FiMinimize2, FiBookOpen, FiCode } from 'react-icons/fi';

// Mobile workspace tab switchers and desktop sidebar toggles for the topic page.
// Rendered in the exact positions the original monolithic render used them:
//   region="header"       → checkpoint mobile tabs header (above the split container)
//   region="split-top"    → desktop sidebar toggle button (inside split container)
//   region="split-tabs"   → standard mobile Learn/Code switcher (inside split container)
export const TopicNavigation = ({ ctx, mode, region }) => {
  const {
    isMobile,
    isCheckpointMode,
    shouldSplitWorkspace,
    activeWorkspaceTab, setActiveWorkspaceTab,
    isCpSidebarOpen, setIsCpSidebarOpen,
    isSidebarOpen, setIsSidebarOpen
  } = ctx;

  // ─── CHECKPOINT MOBILE TABS HEADER (above split container) ─────────────────
  if (region === 'header') {
    if (!isMobile || !isCheckpointMode) return null;
    return (
      <div className="flex bg-[var(--bg-sub)] border-b border-[var(--border)] shrink-0 items-center justify-between px-4 py-1.5">
        <div className="flex flex-1 gap-1">
          <button
            onClick={() => setActiveWorkspaceTab('learn')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeWorkspaceTab === 'learn'
                ? 'bg-[var(--primary)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            🎬 Learn
          </button>
          <button
            onClick={() => setActiveWorkspaceTab('code')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeWorkspaceTab === 'code'
                ? 'bg-[var(--primary)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            ⚡ Code
          </button>
        </div>
        <button
          onClick={() => setIsCpSidebarOpen(!isCpSidebarOpen)}
          className="ml-4 p-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0 flex items-center justify-center shadow-xs"
          title="Toggle Journey"
        >
          <FiList className="text-base" />
        </button>
      </div>
    );
  }

  // ─── DESKTOP SIDEBAR TOGGLE (inside split container, top-left) ────────────
  if (region === 'split-top') {
    if (isMobile) return null;
    if (isCheckpointMode) {
      return (
        <button
          onClick={() => setIsCpSidebarOpen(!isCpSidebarOpen)}
          className="hidden lg:flex absolute left-4 top-3.5 z-50 bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border)] p-2 rounded-xl text-[var(--text-main)] shadow-sm hover:bg-[var(--bg-sub)] transition-all hover:scale-105"
          title={isCpSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isCpSidebarOpen ? <FiMinimize2 size={16} /> : <FiList size={16} />}
        </button>
      );
    }
    return (
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="hidden lg:flex absolute left-4 top-4 z-50 bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border)] p-2.5 rounded-xl text-[var(--text-main)] shadow-lg hover:bg-[var(--bg-sub)] transition-all hover:scale-105"
        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isSidebarOpen ? <FiMinimize2 size={16} /> : <FiList size={16} />}
      </button>
    );
  }

  // ─── STANDARD MOBILE LEARN/CODE SWITCHER (inside split container) ──────────
  if (region === 'split-tabs') {
    if (!isMobile || isCheckpointMode || !shouldSplitWorkspace) return null;
    return (
      <div className="flex p-2 bg-[#141416] border-b border-[var(--border)] shrink-0 gap-2">
        <button
          onClick={() => setActiveWorkspaceTab('learn')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all ${
            activeWorkspaceTab === 'learn'
              ? 'bg-[var(--primary)] text-[var(--text-main)] shadow-sm'
              : 'bg-[var(--bg-sub)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border)]'
          }`}
        >
          <FiBookOpen size={14} /> Learn
        </button>
        <button
          onClick={() => setActiveWorkspaceTab('code')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all ${
            activeWorkspaceTab === 'code'
              ? 'bg-[var(--primary)] text-[var(--text-main)] shadow-sm'
              : 'bg-[var(--bg-sub)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border)]'
          }`}
        >
          <FiCode size={14} /> Code
        </button>
      </div>
    );
  }

  // ─── MODE-SWITCHED DESKTOP TOGGLE used by the unified layout (unused path) ──
  return null;
};