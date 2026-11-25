import { FiPlay } from 'react-icons/fi';

export default function ProgramOutput({ ctx }) {
  const { customInput, setCustomInput, compilerStatus, terminalOutput, handleRunCode, isPanelCollapsed, setIsPanelCollapsed } = ctx;
  const running = compilerStatus === 'running';
  return (
    <section aria-label="Program output" className="flex shrink-0 flex-col border-t border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)]">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <button type="button" onClick={() => setIsPanelCollapsed(!isPanelCollapsed)} aria-expanded={!isPanelCollapsed}
          className="text-xs font-bold">Output {isPanelCollapsed ? '+' : '?'}</button>
        <button type="button" onClick={handleRunCode} disabled={running}
          className="flex items-center gap-2 rounded-lg bg-[var(--brand-green)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          <FiPlay /> {running ? 'Running...' : 'Run Code'}
        </button>
      </div>
      {!isPanelCollapsed && <div className="max-h-64 overflow-auto px-4 pb-3">
        <details className="mb-3 text-xs">
          <summary className="cursor-pointer font-bold">Standard input (optional)</summary>
          <textarea aria-label="Standard input" value={customInput || ''} onChange={(event) => setCustomInput(event.target.value)}
            placeholder="Input your program reads with cin, Scanner or input()." spellCheck={false}
            className="mt-2 min-h-16 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-main)] p-2 font-mono" />
        </details>
        <p role="status" className="mb-2 text-xs text-[var(--text-muted)]">
          {running ? 'Executing your program...' : terminalOutput ? terminalOutput.executionStatus || 'Execution finished' : 'Run your program to see its output here.'}
        </p>
        {!running && terminalOutput && <>
          {terminalOutput.compileOutput && <pre aria-label="Compiler output" className="mb-2 whitespace-pre-wrap break-words font-mono text-xs text-red-500">{terminalOutput.compileOutput}</pre>}
          {terminalOutput.stderr && <pre aria-label="Standard error" className="mb-2 whitespace-pre-wrap break-words font-mono text-xs text-red-500">{terminalOutput.stderr}</pre>}
          <pre aria-label="Standard output" className="min-h-12 whitespace-pre-wrap break-words rounded-lg bg-[var(--bg-main)] p-3 font-mono text-xs">{terminalOutput.stdout || '(no output)'}</pre>
        </>}
      </div>}
    </section>
  );
}
