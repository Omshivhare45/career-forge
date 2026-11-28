import { useEffect, useRef, useState } from 'react';

export default function useCountUp() {
  const strip = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    let observer;
    function finish() {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      setProgress(1);
    }
    if (motion.matches || !window.IntersectionObserver) {
      finish();
      return;
    }
    observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / 1250);
        setProgress(1 - (1 - t) ** 3);
        if (t < 1) frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.25 });
    observer.observe(strip.current);
    motion.addEventListener('change', finish);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      motion.removeEventListener('change', finish);
    };
  }, []);

  return [strip, progress];
}
