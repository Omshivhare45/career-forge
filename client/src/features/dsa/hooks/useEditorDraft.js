import { useEffect, useMemo, useRef, useState } from 'react';

function read(path) {
  try { return sessionStorage.getItem(path); } catch { return null; }
}

export function useEditorDraft(path, boilerplate) {
  const [edits, setEdits] = useState({});
  const pending = useRef(new Map());
  const saved = useMemo(() => read(path), [path]);
  const value = edits[path] ?? saved ?? boilerplate;

  function flush() {
    for (const [key, text] of pending.current) {
      try { sessionStorage.setItem(key, text); } catch { /* Storage may be full. */ }
    }
    pending.current.clear();
  }

  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, []);
  useEffect(() => {
    if (!pending.current.size) return;
    const timer = setTimeout(flush, 300);
    return () => clearTimeout(timer);
  }, [edits]);

  return [value, (text, target = path) => {
    pending.current.set(target, text);
    setEdits(previous => ({ ...previous, [target]: text }));
  }];
}
