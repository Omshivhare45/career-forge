import { Link } from 'react-router-dom';
import {
  FiCode, FiPlay, FiCheckCircle, FiTerminal, FiArrowLeft,
  FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import CodeEditor from '../../../components/CodeEditor';
import WebDevPlayground from '../../../components/WebDevPlayground';

// Right pane — the code editor and console. Two variants:
//   'checkpoint' → per-checkpoint CodeEditor + run bar + mini console
//   'standard'   → full toolbar + Monaco + full console terminal + actions bar
export const CodeWorkspace = ({ ctx, variant }) => {
  const {
    id,
    editorCode, setEditorCode,
    editorTheme,
    toggleWorkspaceTheme,
    compilerStatus,
    activeConsoleTab, setActiveConsoleTab,
    consoleLogs,
    testResults,
    selectedLang,
    checkpointCodePassed,
    isMobile,
    activeWorkspaceTab,
    isFullscreen, setIsFullscreen,
    handleRunCode,
    handleCheckpointRunCode,
    handleSubmitCode,
    handleGamificationUpdate,
    handleEditorWillMount,
    handleOpenInNewTab,
    activeCheckpointContent,
    langContent,
    availableLanguages,
    setSelectedLang,
    setEditorCode: _setEditorCode,
    setCompilerStatus,
    setTestResults,
    setConsoleLogs,
    isWebDevDomain,
    isCheckpointMode,
    activeDomainProgress,
    refreshUser,
    triggerConfettiExplosion,
    handleLoadSubmission
  } = ctx;

  const cpContent = activeCheckpointContent;

  // ─── CHECKPOINT VARIANT ────────────────────────────────────────────────────
  if (variant === 'checkpoint') {
    return (
      <div className={`flex-1 h-full flex flex-col overflow-hidden bg-[#1e1e1e] min-w-0
        ${isMobile && activeWorkspaceTab !== 'code' ? 'hidden' : 'flex'}
      `}>
        {isWebDevDomain ? (
          <WebDevPlayground
            topicId={id}
            boilerplate={{
              html: cpContent?.editorBoilerplate || '',
              css: '',
              js: ''
            }}
            editorTheme={editorTheme}
          />
        ) : (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42] shrink-0">
              <div className="flex items-center gap-2">
                <FiCode className="text-[var(--primary)] text-sm" />
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Code Editor</span>
                <span className="text-[9px] font-bold text-[var(--text-light)] bg-[var(--border-light)] px-2 py-0.5 rounded border border-[var(--border)]">
                  {selectedLang.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {cpContent?.challengeTitle && (
                  <span className="text-[9px] text-[var(--text-light)] font-semibold hidden sm:block">
                    {cpContent.challengeTitle}
                  </span>
                )}
                <button
                  onClick={() => { if (cpContent?.editorBoilerplate) setEditorCode(cpContent.editorBoilerplate); }}
                  className="text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-wider transition-colors px-2.5 py-1 rounded hover:bg-gray-300 border border-[var(--border)]"
                >
                  Reset ↺
                </button>
              </div>
            </div>

            {cpContent?.assessmentType === 'mcq' || cpContent?.assessmentType === 'tracing' ? (
              <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">🧠</div>
                <h3 className="text-xl font-black text-[var(--text-main)] mb-2">Interactive {cpContent.assessmentType === 'mcq' ? 'Knowledge Check' : 'Tracing Challenge'}</h3>
                <p className="text-[var(--text-muted)] mb-6 max-w-md">
                  This checkpoint focuses on conceptual understanding. Answer the questions on the left panel (or mark as done) to proceed.
                </p>
                <button
                  onClick={() => {
                    ctx.setChallengePassed(true);
                    ctx.setCheckpointCodePassed(true);
                    toast.success('Assessment completed! You can now mark this checkpoint as done.');
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-main)] font-bold rounded-xl shadow-lg transition-colors"
                >
                  Simulate Assessment Pass ✅
                </button>
              </div>
            ) : (
              <>
                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden min-h-[400px] w-full relative" style={{ minHeight: '400px' }}>
                  <CodeEditor
                    language={selectedLang === 'js' ? 'javascript' : selectedLang}
                    value={editorCode || (cpContent?.editorBoilerplate || '')}
                    theme={editorTheme}
                    onChange={(val) => setEditorCode(val || '')}
                    options={{
                      fontSize: 13,
                      tabSize: 4,
                      wordWrap: 'on',
                      padding: { top: 16 }
                    }}
                  />
                </div>

                {/* Run/Submit bar */}
                <div className="px-4 py-2.5 bg-[#252526] border-t border-[#3e3e42] flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleCheckpointRunCode}
                    disabled={compilerStatus === 'running'}
                    className="flex items-center gap-2 px-5 py-2 bg-[#2d7d46] hover:bg-emerald-600 text-[var(--text-main)] rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 shadow"
                  >
                    <FiPlay size={11} />
                    {compilerStatus === 'running' ? 'Running...' : 'Run Code'}
                  </button>

                  {/* Result badge */}
                  {compilerStatus !== 'idle' && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border ${
                      compilerStatus === 'passed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      compilerStatus === 'failed' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                      compilerStatus === 'compile_error' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                      'bg-[var(--border-light)] text-[var(--text-muted)] border-[var(--border)]'
                    }`}>
                      {compilerStatus === 'passed' ? '✅ All Passed!' :
                       compilerStatus === 'failed' ? '❌ Wrong Answer' :
                       compilerStatus === 'compile_error' ? '💥 Compile Error' : '⚡ Running...'}
                    </div>
                  )}

                  {checkpointCodePassed && (
                    <div className="ml-auto flex items-center gap-1.5 text-emerald-500 text-[10px] font-black">
                      <FiCheckCircle size={11} /> Ready to unlock!
                    </div>
                  )}
                </div>

                {/* Console / Test results */}
                <div className="h-44 bg-[#1a1a1a] border-t border-[#3e3e42] flex flex-col overflow-hidden shrink-0">
                  <div className="flex items-center gap-4 px-4 py-1.5 bg-[#252526] border-b border-[#3e3e42]">
                    <button
                      onClick={() => setActiveConsoleTab('testcase')}
                      className={`text-[10px] font-black uppercase tracking-wider pb-0.5 transition-colors ${activeConsoleTab === 'testcase' ? 'text-[var(--text-main)] border-b-2 border-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                      Test Cases
                    </button>
                    <button
                      onClick={() => setActiveConsoleTab('result')}
                      className={`text-[10px] font-black uppercase tracking-wider pb-0.5 transition-colors ${activeConsoleTab === 'result' ? 'text-[var(--text-main)] border-b-2 border-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                      Output Log
                    </button>
                    {selectedLang === 'html' && (
                      <button
                        onClick={() => setActiveConsoleTab('preview')}
                        className={`text-[10px] font-black uppercase tracking-wider pb-0.5 transition-colors ${activeConsoleTab === 'preview' ? 'text-[var(--text-main)] border-b-2 border-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                      >
                        Live Preview 👁️
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {activeConsoleTab === 'testcase' ? (
                      <div className="space-y-2">
                        {testResults.length === 0 ? (
                          <p className="text-[var(--text-light)] text-[10px] font-mono italic">Click "Run Code" to test your solution...</p>
                        ) : testResults.map((r, i) => (
                          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg text-[10px] font-mono border ${
                            r.status === 'passed'
                              ? 'bg-emerald-500/8 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/8 text-red-400 border-red-500/20'
                          }`}>
                            <span className="text-sm">{r.status === 'passed' ? '✅' : '❌'}</span>
                            <span className="text-[var(--text-muted)]">TC {i + 1}</span>
                            <span className="text-[var(--text-light)]">Expected:</span>
                            <span className="text-[var(--text-main)] font-black">{r.expected}</span>
                            <span className="text-[var(--text-light)]">Got:</span>
                            <span className={r.status === 'passed' ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>{r.actual}</span>
                          </div>
                        ))}
                      </div>
                    ) : activeConsoleTab === 'result' ? (
                      <div className="space-y-1">
                        {consoleLogs.length === 0 ? (
                          <p className="text-[var(--text-light)] text-[10px] font-mono italic">No output yet...</p>
                        ) : consoleLogs.map((log, i) => (
                          <div key={i} className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed">{log}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[120px] bg-[var(--bg-card)] rounded-lg overflow-hidden border border-[var(--border)] relative group">
                        <iframe
                          title="checkpoint-live-preview"
                          srcDoc={editorCode}
                          sandbox="allow-scripts"
                          className="w-full h-full bg-[var(--bg-card)] border-none min-h-[120px]"
                        />
                        <button
                          onClick={handleOpenInNewTab}
                          className="absolute top-2 right-2 px-3 py-1.5 bg-black/70 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-all shadow-lg backdrop-blur-sm"
                        >
                          Open in Local Host
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // ─── STANDARD VARIANT (LOVE BABBAR / STRIVER / NON-CODING EDITOR) ──────────
  return (
    <div
      style={{ width: isFullscreen ? '100%' : (isMobile ? '100%' : `${100 - ctx.leftWidth}%`) }}
      className={`flex-1 h-full flex-col overflow-hidden bg-[#09090b] shrink-0 ${
        isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : 'relative'
      } ${isMobile && activeWorkspaceTab !== 'code' ? 'hidden' : 'flex'}`}
    >
      {isWebDevDomain ? (
        <WebDevPlayground
          topicId={id}
          boilerplate={{
            html: langContent?.editorBoilerplate || '',
            css: '',
            js: ''
          }}
          editorTheme={editorTheme}
        />
      ) : (
        <>
          {/* Editor Header Controller panel */}
          <div className="bg-[#141416] px-4 py-2 border-b border-[var(--border)] flex justify-between items-center text-xs text-[var(--text-muted)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-[var(--bg-sub)] p-0.5 rounded-lg border border-[var(--border)]">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                      selectedLang === lang
                        ? 'bg-[var(--primary)] text-[var(--text-main)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleWorkspaceTheme}
                className="px-2.5 py-1 rounded bg-[var(--bg-sub)] border border-[var(--border)] hover:bg-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-[9px] font-black transition-all uppercase cursor-pointer"
              >
                Theme: {editorTheme === 'vs-dark' ? 'DARK 🌙' : 'LIGHT ☀️'}
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-2.5 py-1 rounded bg-[var(--bg-sub)] border border-[var(--border)] hover:bg-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-[9px] font-black transition-all uppercase flex items-center gap-1 cursor-pointer"
                title="Maximize code playground workspace"
              >
                {isFullscreen ? <FiMinimize2 size={10} /> : <FiMaximize2 size={10} />}
                <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </button>

              <button
                onClick={() => {
                  if (langContent?.editorBoilerplate) {
                    setEditorCode(langContent.editorBoilerplate);
                    toast.success("Editor code reset to default boilerplate!");
                  }
                }}
                className="px-2.5 py-1 rounded bg-[var(--bg-sub)] border border-[var(--border)] hover:bg-[var(--border-light)] text-rose-400 hover:text-rose-300 text-[9px] font-black transition-all uppercase cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[250px] w-full relative overflow-hidden bg-[#1e1e1e] editor-glow">
            <CodeEditor
              language={selectedLang === 'js' ? 'javascript' : selectedLang}
              value={editorCode}
              beforeMount={handleEditorWillMount}
              onChange={(val) => setEditorCode(val || '')}
              theme={editorTheme}
              options={{
                fontSize: 13
              }}
            />
          </div>

          {/* BOTTOM PANEL: Console Terminal & Runner Results */}
          <div className="h-[38%] min-h-[200px] border-t border-[var(--border)] bg-[#09090b] flex flex-col justify-between overflow-hidden shrink-0">

            {/* Console Tab header selectors */}
            <div className="bg-[#111113] px-4 py-2 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveConsoleTab('testcase')}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${
                    activeConsoleTab === 'testcase'
                      ? 'bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setActiveConsoleTab('result')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${
                    activeConsoleTab === 'result'
                      ? 'bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Run Result
                  {compilerStatus !== 'idle' && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      compilerStatus === 'running' ? 'bg-amber-400 animate-ping' : compilerStatus === 'passed' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`} />
                  )}
                </button>
                {selectedLang === 'html' && (
                  <button
                    onClick={() => setActiveConsoleTab('preview')}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${
                      activeConsoleTab === 'preview'
                        ? 'bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Live Preview 👁️
                  </button>
                )}
              </div>

              <div className="text-[8px] font-mono text-[var(--text-light)] uppercase">
                {compilerStatus === 'running' ? 'Sandbox Busy...' : 'Console Ready'}
              </div>
            </div>

            {/* Console Body Area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] text-[var(--text-muted)] custom-scrollbar select-text">

              {/* Active Tab: Testcases list display */}
              {activeConsoleTab === 'testcase' && langContent && langContent.testCases && (
                <div className="space-y-3">
                  <div className="text-[var(--text-light)] uppercase text-[8px] font-black tracking-widest mb-2">Sample Test Cases (Vetted Inputs)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {langContent.testCases.slice(0, 2).map((tc, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-sub)] border border-[var(--border)] flex flex-col justify-between gap-1.5">
                        <div>
                          <div className="text-[7px] font-black text-[var(--text-muted)] uppercase">Input Case {idx + 1}</div>
                          <div className="text-[10px] font-bold text-[var(--text-main)] select-all truncate">{tc.input}</div>
                        </div>
                        <div>
                          <div className="text-[7px] font-black text-[var(--text-muted)] uppercase">Expected Output</div>
                          <div className="text-[9px] font-black text-emerald-400 select-all truncate">{tc.expected}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[8.5px] text-[var(--text-muted)] italic mt-1 font-bold uppercase tracking-wider">
                    🔒 Hidden Test Cases are active and will run on "Submit Code" to verify optimality.
                  </div>
                </div>
              )}

              {/* Active Tab: Execution Logs Terminal */}
              {activeConsoleTab === 'result' && (
                <div className="space-y-3.5">
                  {compilerStatus === 'compile_error' ? (
                    <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-300 font-mono text-xs space-y-2">
                      <div className="flex items-center gap-2 text-red-400 font-black uppercase text-sm">
                        ⚠️ Compilation Error
                      </div>
                      <div className="bg-black/40 p-3 rounded-lg border border-red-950 text-[10px] leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-wrap select-text scrollbar-thin">
                        {consoleLogs[consoleLogs.length - 1]}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] italic mt-2">
                        Tip: Check your brackets, semicolons, and variable types. Make sure your syntax matches standard implementations.
                      </div>
                    </div>
                  ) : consoleLogs.length === 0 ? (
                    <div className="text-[var(--text-light)] italic py-5 text-center">
                      No compilation outputs logged yet. Click "Run Code" or "Submit Code" below!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="border-b border-[var(--border)] pb-1 flex justify-between items-center text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        <span>Compiler Console Logs</span>
                        <span className={compilerStatus === 'passed' ? 'text-emerald-500' : compilerStatus === 'failed' ? 'text-rose-500' : 'text-amber-500'}>
                          Status: {compilerStatus.toUpperCase()}
                        </span>
                      </div>

                      {testResults.length > 0 && (
                        <div className="space-y-3">
                          {compilerStatus === 'passed' && (
                            <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-emerald-300 font-mono text-xs space-y-2">
                              <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-sm">
                                🏆 Accepted! All test cases passed! +100 XP 🏆
                              </div>
                              <p className="text-[10px] font-bold text-emerald-200">
                                Congratulations! All sample and hidden test cases passed perfectly. Your solution is highly optimal! 🚀
                              </p>
                            </div>
                          )}

                          {compilerStatus === 'failed' && (
                            <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-300 font-mono text-xs space-y-2">
                              <div className="flex items-center gap-2 text-rose-400 font-black uppercase text-sm">
                                ❌ Solution Rejected (Wrong Answer)
                              </div>
                              <p className="text-[10px] font-bold text-rose-200">
                                Some test cases returned incorrect outputs. Review your loop bounds, base cases, and return types, and try again!
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {testResults.map((tr, idx) => (
                              <div key={idx} className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                                tr.status === 'passed'
                                  ? 'bg-emerald-950/15 border-emerald-900/40 text-emerald-300'
                                  : 'bg-rose-950/15 border-rose-900/40 text-rose-300'
                              }`}>
                                <div>
                                  <div className="text-[7px] font-black uppercase text-[var(--text-muted)] flex justify-between">
                                    <span>{tr.isHidden ? `Hidden Case ${idx + 1}` : `Sample Case ${idx + 1}`}</span>
                                    <span className={tr.status === 'passed' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                      {tr.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="text-[9px] font-bold text-[var(--text-muted)] select-all truncate mt-0.5">
                                    Input: {tr.isHidden ? '[Hidden Test Case]' : tr.input}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-1 mt-1 pt-1.5 border-t border-[var(--border)] font-mono text-[8px]">
                                  <div>
                                    <div className="text-[6px] font-black text-[var(--text-light)] uppercase">Expected</div>
                                    <div className="text-[9px] font-bold truncate text-emerald-400">
                                      {tr.isHidden ? '[Hidden]' : tr.expected}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[6px] font-black text-[var(--text-light)] uppercase">Actual</div>
                                    <div className={`text-[9px] font-bold truncate ${tr.status === 'passed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {tr.isHidden ? '[Hidden]' : tr.actual}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-[#050505] p-3 rounded-lg border border-zinc-950 space-y-1 overflow-y-auto max-h-[100px] scrollbar-thin">
                        {consoleLogs.map((log, idx) => (
                          <div key={idx} className={`leading-relaxed ${
                            log.startsWith('🟢')
                              ? 'text-emerald-400'
                              : log.startsWith('❌') || log.startsWith('💥')
                                ? 'text-rose-400'
                                : 'text-[var(--text-muted)]'
                          }`}>
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeConsoleTab === 'preview' && selectedLang === 'html' && (
                <div className="w-full h-full min-h-[160px] bg-[var(--bg-card)] rounded-lg overflow-hidden border border-[var(--border)] relative group">
                  <iframe
                    title="live-preview"
                    srcDoc={editorCode}
                    sandbox="allow-scripts"
                    className="w-full h-full bg-[var(--bg-card)] border-none min-h-[160px]"
                  />
                  <button
                    onClick={handleOpenInNewTab}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-black/70 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-all shadow-lg backdrop-blur-sm"
                  >
                    Open in Local Host
                  </button>
                </div>
              )}
            </div>

            {/* Terminal Actions Bottom sticky bar */}
            <div className="bg-[#0b0b0d] border-t border-[var(--border)] px-4 py-3 flex justify-between items-center shrink-0">
              <Link to="/roadmap" className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] text-[9px] font-black uppercase tracking-wider transition-colors shrink-0">
                <FiArrowLeft size={10} /> Roadmap
              </Link>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("Skip this challenge and mark it as passed?")) {
                      setCompilerStatus('passed');
                      ctx.setChallengePassed(true);
                      handleGamificationUpdate();
                      const isAlreadyCompleted = activeDomainProgress.completedTopics?.some(t => t.topicId === id || t.topicId?._id === id);
                      if (!isAlreadyCompleted) {
                        try {
                          const res = await api.post('/progress/complete-topic', {
                            topicId: id,
                            studyTimeMinutes: 10,
                            notes: 'Skipped coding challenge.',
                            difficultyFeedback: 'easy',
                            confidenceLevel: 3,
                            revisionNeeded: false
                          });
                          await refreshUser();
                        } catch (autoErr) {
                          console.error('Failed to auto-complete topic:', autoErr);
                        }
                      }
                      toast.success('Challenge skipped and marked as complete! 🚀');
                    }
                  }}
                  className="px-3 py-2 bg-[var(--bg-sub)] hover:bg-[var(--bg-sub)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-dashed border-[var(--border)] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                >
                  ⏭️ Skip Challenge
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={compilerStatus === 'running'}
                  className="px-4 py-2 bg-[var(--bg-sub)] border border-[var(--border)] hover:bg-[var(--border-light)] text-[var(--text-main)] rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <FiTerminal size={10} /> Run Code
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={compilerStatus === 'running'}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-[var(--text-main)] rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <FiCheckCircle size={10} /> Submit Code
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};