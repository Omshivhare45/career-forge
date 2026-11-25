import { useState, useEffect, useRef } from 'react';
import {
  FiPlay, FiTrash2, FiRotateCcw, FiCode, FiTerminal,
  FiAlertTriangle, FiSun, FiMoon, FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSignInPrompt } from '../hooks/useSignInPrompt';
import CodeEditor from '../components/CodeEditor';
import codeApi from '../api/codeApi';

const LANGUAGE_KEY = 'cf_ide_lang';
const CODE_KEY = 'cf_ide_code';
const STDIN_KEY = 'cf_ide_stdin';

// Languages supported by the Judge0 backend (/api/code/execute).
const LANGUAGES = [
  {
    key: 'cpp',
    label: 'C++',
    monaco: 'cpp',
    boilerplate: '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n'
  },
  {
    key: 'java',
    label: 'Java',
    monaco: 'java',
    boilerplate: 'public class Main {\n    public static void main(String[] args) {\n    }\n}\n'
  },
  {
    key: 'python',
    label: 'Python',
    monaco: 'python',
    boilerplate: 'def main():\n    pass\n\nif __name__ == "__main__":\n    main()\n'
  },
  {
    key: 'javascript',
    label: 'JavaScript',
    monaco: 'javascript',
    boilerplate: ''
  }
];

const DEFAULT_STDIN = '';

const buildDefaultCodeMap = () =>
  LANGUAGES.reduce((acc, lang) => {
    acc[lang.key] = lang.boilerplate;
    return acc;
  }, {});

const readStoredCode = () => {
  try {
    const raw = localStorage.getItem(CODE_KEY);
    if (!raw) return buildDefaultCodeMap();
    const parsed = JSON.parse(raw);
    const defaults = buildDefaultCodeMap();
    return LANGUAGES.reduce((acc, lang) => {
      acc[lang.key] = typeof parsed[lang.key] === 'string' ? parsed[lang.key] : defaults[lang.key];
      return acc;
    }, {});
  } catch {
    return buildDefaultCodeMap();
  }
};

const IdeWorkspace = ({ canSave }) => {
  const promptSignIn = useSignInPrompt();
  const rootRef = useRef(null);

  const [languageKey, setLanguageKey] = useState(() => (canSave && localStorage.getItem(LANGUAGE_KEY)) || 'cpp');
  const [codeByLang, setCodeByLang] = useState(() => canSave ? readStoredCode() : buildDefaultCodeMap());
  const [stdin, setStdin] = useState(() => {
    if (!canSave) return DEFAULT_STDIN;
    const stored = localStorage.getItem(STDIN_KEY);
    return stored === null ? DEFAULT_STDIN : stored;
  });
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('output');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [requestError, setRequestError] = useState('');

  const [panelHeight, setPanelHeight] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const activeLang = LANGUAGES.find((lang) => lang.key === languageKey) || LANGUAGES[0];
  const code = codeByLang[languageKey] || '';

  // Persist workspace so code/stdin survive reloads and panel/language switches.
  useEffect(() => {
    if (canSave) localStorage.setItem(LANGUAGE_KEY, languageKey);
  }, [languageKey, canSave]);

  useEffect(() => {
    if (canSave) localStorage.setItem(CODE_KEY, JSON.stringify(codeByLang));
  }, [codeByLang, canSave]);

  useEffect(() => {
    if (canSave) localStorage.setItem(STDIN_KEY, stdin);
  }, [stdin, canSave]);

  // Drag-to-resize the bottom output panel.
  useEffect(() => {
    if (!isResizing) return undefined;

    const handleMove = (event) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const next = rect.bottom - event.clientY;
      setPanelHeight(Math.min(Math.max(next, 140), Math.max(160, rect.height - 200)));
    };
    const handleUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const handleCodeChange = (value) => {
    setCodeByLang((prev) => ({ ...prev, [languageKey]: value || '' }));
  };

  const handleResetCode = () => {
    setCodeByLang((prev) => ({ ...prev, [languageKey]: activeLang.boilerplate }));
    toast.success(`${activeLang.label} code reset to the default template.`);
  };

  const handleClearOutput = () => {
    setResult(null);
    setRequestError('');
    setActiveTab('output');
  };

  const handleRun = async () => {
    if (!canSave) return promptSignIn("Sign in to run code.");
    if (running) return;
    if (!code.trim()) {
      toast.error('Write some code first.');
      return;
    }

    setRunning(true);
    setRequestError('');
    setResult(null);

    try {
      const response = await codeApi.execute({
        language: activeLang.label,
        code,
        stdin
      });

      const data = response.data?.data || {};
      setResult({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        compileOutput: data.compile_output || '',
        executionStatus: data.executionStatus || '',
        status: data.status || '',
        runtime: data.runtime || '',
        memory: data.memory || ''
      });

      if (data.compile_output || data.stderr || data.executionStatus) {
        setActiveTab('errors');
        toast.error(data.executionStatus || 'Execution finished with errors.');
      } else {
        setActiveTab('output');
        toast.success('Executed successfully.');
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Execution failed. Please try again.';
      setRequestError(message);
      setActiveTab('errors');
      toast.error(message);
    } finally {
      setRunning(false);
    }
  };

  const hasErrors = Boolean(
    requestError ||
    result?.compileOutput ||
    result?.stderr ||
    result?.executionStatus
  );

  const statusLabel = requestError
    ? 'Request Failed'
    : result?.executionStatus || result?.status || '';

  const statusTone = hasErrors ? 'text-rose-400' : 'text-emerald-400';

  const tabs = [
    { key: 'input', label: 'Custom Input' },
    { key: 'output', label: 'Output' },
    { key: 'errors', label: 'Errors' }
  ];

  return (
    <div ref={rootRef} className="h-full flex flex-col overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Toolbar */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 bg-[var(--bg-card)]/95 backdrop-blur border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--primary)] to-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
            <FiCode size={16} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black leading-none truncate">CareerForge IDE</h1>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
              Write &amp; run your own programs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Language selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen((prev) => !prev)}
              disabled={running}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-sub)] border border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-main)] text-[11px] font-black transition-all disabled:opacity-60"
            >
              {activeLang.label}
              <FiChevronDown className={`text-[10px] transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.key}
                      type="button"
                      onClick={() => {
                        setLanguageKey(lang.key);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[11px] font-bold transition-colors ${
                        lang.key === languageKey
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setEditorTheme((prev) => (prev === 'vs-dark' ? 'light' : 'vs-dark'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-[10px] font-black uppercase transition-all"
            title="Toggle editor theme"
          >
            {editorTheme === 'vs-dark' ? <FiSun className="text-amber-400" /> : <FiMoon className="text-indigo-400" />}
          </button>

          <button
            type="button"
            onClick={handleResetCode}
            disabled={running}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-muted)] hover:text-rose-400 text-[10px] font-black uppercase transition-all disabled:opacity-60"
            title="Reset code to the default template"
          >
            <FiRotateCcw size={11} />
            <span className="hidden sm:inline">Reset Code</span>
          </button>

          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[var(--primary)] to-emerald-600 hover:brightness-110 text-white text-[11px] font-black uppercase tracking-wide shadow-md shadow-[var(--primary)]/25 transition-all disabled:opacity-60"
          >
            {running ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Running
              </>
            ) : (
              <>
                <FiPlay size={12} />
                Run
              </>
            )}
          </button>
        </div>
      </header>

      {/* Workspace: editor + resizable bottom panel */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-w-0 w-full min-h-0 relative overflow-hidden bg-[#1e1e1e]">
          <CodeEditor
            language={activeLang.monaco}
            value={code}
            onChange={handleCodeChange}
            theme={editorTheme}
            options={{ fontSize: 13 }}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={() => setIsResizing(true)}
          title="Drag to resize the output panel"
          className={`h-1.5 w-full shrink-0 cursor-row-resize transition-colors ${
            isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-light)] hover:bg-[var(--primary)]'
          }`}
        />

        {/* Bottom panel */}
        <div
          className="shrink-0 border-t border-[var(--border)] bg-[#0b0b0d] flex flex-col overflow-hidden"
          style={{ height: `${panelHeight}px` }}
        >
          {/* Panel header */}
          <div className="bg-[#111113] px-3 sm:px-4 py-2 border-b border-[var(--border)] flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${
                    activeTab === tab.key
                      ? 'bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'input' && stdin.trim() && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  {tab.key === 'errors' && hasErrors && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {statusLabel && (
                <span className={`text-[9px] font-black uppercase tracking-wider ${statusTone}`}>{statusLabel}</span>
              )}
              {result?.runtime && <span className="hidden sm:inline text-[9px] font-bold text-[var(--text-muted)]">⏱ {result.runtime}</span>}
              {result?.memory && <span className="hidden sm:inline text-[9px] font-bold text-[var(--text-muted)]">💾 {result.memory}</span>}
              <button
                type="button"
                onClick={handleClearOutput}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase text-[var(--text-muted)] hover:text-rose-400 transition-colors"
              >
                <FiTrash2 size={10} />
                Clear
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4">
            {activeTab === 'input' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5 text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <FiTerminal size={10} /> Standard Input (stdin) — one or more lines
                </div>
                <textarea
                  value={stdin}
                  onChange={(event) => setStdin(event.target.value)}
                  spellCheck={false}
                  placeholder="Type the input your program reads from stdin..."
                  className="flex-1 w-full min-h-[80px] resize-none bg-[#050505] border border-[var(--border)] rounded-lg p-3 text-[12px] font-mono leading-relaxed text-[var(--text-main)] outline-none focus:border-[var(--primary)]/60"
                />
              </div>
            )}

            {activeTab === 'output' && (
              running ? (
                <div className="flex items-center gap-2 text-amber-400 py-6 text-[11px] font-bold">
                  <span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  Running your program on the server...
                </div>
              ) : (
                <pre className="text-[12px] font-mono leading-relaxed whitespace-pre-wrap select-text text-[var(--text-main)]">
                  {result?.stdout && result.stdout.trim().length > 0 ? result.stdout : (
                    <span className="text-[var(--text-light)] italic">No output yet. Click "Run" to execute your program.</span>
                  )}
                </pre>
              )
            )}

            {activeTab === 'errors' && (
              running ? (
                <div className="flex items-center gap-2 text-amber-400 py-6 text-[11px] font-bold">
                  <span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  Running your program on the server...
                </div>
              ) : hasErrors ? (
                <div className="space-y-3">
                  {requestError && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-rose-400 mb-1">
                        <FiAlertTriangle size={11} /> Request Error
                      </div>
                      <pre className="bg-black/50 border border-rose-950 rounded-lg p-3 text-[11px] font-mono leading-relaxed whitespace-pre-wrap select-text text-rose-300">
                        {requestError}
                      </pre>
                    </div>
                  )}

                  {(result?.compileOutput || result?.executionStatus === 'Compilation Error') && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-rose-400 mb-1">
                        <FiAlertTriangle size={11} /> Compilation Error
                      </div>
                      <pre className="bg-black/50 border border-rose-950 rounded-lg p-3 text-[11px] font-mono leading-relaxed whitespace-pre-wrap select-text text-rose-300">
                        {result?.compileOutput || 'Your code did not compile.'}
                      </pre>
                    </div>
                  )}

                  {(result?.stderr || (result?.executionStatus && result.executionStatus !== 'Compilation Error')) && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-rose-400 mb-1">
                        <FiAlertTriangle size={11} /> {result?.executionStatus || 'Runtime Error'}
                      </div>
                      <pre className="bg-black/50 border border-rose-950 rounded-lg p-3 text-[11px] font-mono leading-relaxed whitespace-pre-wrap select-text text-rose-300">
                        {result?.stderr || 'The program exited with an error.'}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-[11px] text-[var(--text-light)] italic">
                  No errors. Compilation and runtime errors will appear here.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Ide() {
  const { user } = useAuth();
  return <IdeWorkspace key={user?._id || "guest"} canSave={Boolean(user)} />;
}
