import React, { Suspense, lazy, useRef, useEffect, memo } from 'react';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// Custom CareerForge dark theme — premium syntax colors matching brand palette
const defineCareerForgeTheme = (monaco) => {
  monaco.editor.defineTheme('careerforge-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'keyword.control', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'constant', foreground: '4FC1FF' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'delimiter', foreground: 'D4D4D4' },
      { token: 'tag', foreground: '569CD6' },
      { token: 'attribute.name', foreground: '9CDCFE' },
      { token: 'attribute.value', foreground: 'CE9178' },
    ],
    colors: {
      'editor.background': '#0f0f12',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#1a1a22',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#1a3050',
      'editorCursor.foreground': '#34D399',
      'editorLineNumber.foreground': '#3f3f46',
      'editorLineNumber.activeForeground': '#a1a1aa',
      'editor.selectionHighlightBackground': '#add6ff26',
      'editorBracketMatch.background': '#0064001a',
      'editorBracketMatch.border': '#308D46',
      'editorIndentGuide.background': '#1e1e24',
      'editorIndentGuide.activeBackground': '#3f3f46',
      'editorGutter.background': '#0f0f12',
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#27272a80',
      'scrollbarSlider.hoverBackground': '#3f3f46',
      'scrollbarSlider.activeBackground': '#52525b',
      'editorOverviewRuler.border': '#00000000',
    }
  });

  monaco.editor.defineTheme('careerforge-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'AF00DB' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267F99' },
      { token: 'function', foreground: '795E26' },
      { token: 'variable', foreground: '001080' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#1E293B',
      'editor.lineHighlightBackground': '#F8FAFC',
      'editorCursor.foreground': '#308D46',
      'editorLineNumber.foreground': '#CBD5E1',
      'editorLineNumber.activeForeground': '#64748B',
      'editorBracketMatch.border': '#308D46',
      'editorGutter.background': '#FFFFFF',
    }
  });
};

const EditorLoader = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0f12] gap-3">
    <div className="relative">
      <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
      <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-b-emerald-500/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
    </div>
    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Loading Editor</span>
    <div className="flex gap-1 mt-1">
      <div className="w-1 h-1 rounded-full bg-emerald-500/50 animate-pulse" style={{ animationDelay: '0s' }} />
      <div className="w-1 h-1 rounded-full bg-emerald-500/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
      <div className="w-1 h-1 rounded-full bg-emerald-500/50 animate-pulse" style={{ animationDelay: '0.4s' }} />
    </div>
  </div>
);

const CodeEditor = memo(({
  value = '',
  language = 'javascript',
  theme = 'vs-dark',
  onChange,
  beforeMount,
  options = {},
  className = '',
}) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(() => {
      editorRef.current?.layout();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Map generic theme names to our custom CareerForge themes
  const resolvedTheme = theme === 'vs-dark' ? 'careerforge-dark' : theme === 'light' ? 'careerforge-light' : theme;

  const handleBeforeMount = (monaco) => {
    defineCareerForgeTheme(monaco);
    // Call any additional beforeMount handler from the parent
    if (beforeMount) {
      beforeMount(monaco);
    }
  };

  const mergedOptions = {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    automaticLayout: false,
    tabSize: 4,
    wordWrap: 'on',
    padding: { top: 16, bottom: 16 },
    renderLineHighlight: 'all',
    bracketPairColorization: { enabled: true },
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    ...options,
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[200px] ${className}`}>
      <Suspense fallback={<EditorLoader />}>
        <MonacoEditor
          width="100%"
          height="100%"
          language={language}
          value={value}
          theme={resolvedTheme}
          beforeMount={handleBeforeMount}
          onMount={(editor) => {
            editorRef.current = editor;
            requestAnimationFrame(() => editor.layout());
          }}
          onChange={(val) => onChange?.(val ?? '')}
          loading={<EditorLoader />}
          options={mergedOptions}
        />
      </Suspense>
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;

