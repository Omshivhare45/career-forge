import { useEffect, useState } from 'react';
import { peekCurriculum, readCurriculum } from '../api/curriculum';

// A warm route can paint during render. A superseded request can still warm
// the shared cache, but only its current subscriber may update this pane.
export function useCurriculum(path) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!path) return;
    let current = true;
    readCurriculum(path).then(data => {
      if (current) setResult({ path, data });
    }, error => {
      if (current) setResult({ path, error });
    });
    return () => { current = false; };
  }, [path]);
  const data = path && (peekCurriculum(path) ?? (result?.path === path ? result.data : undefined));
  const error = result && result.path === path && result.error;
  return { data, error, loading: Boolean(path && !data && !error) };
}
