import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion/dom/mini';
import { scroll } from 'framer-motion/dom';

export default function usePathwayScroll(domains) {
  const dashboard = useRef(null);

  useEffect(() => {
    const container = dashboard.current?.closest('main');
    if (!container || !domains?.length) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stop = [];
    function syncMotion() {
      stop.forEach(disconnect => disconnect());
      stop = [];
      if (preference.matches) return;

      for (const card of dashboard.current.querySelectorAll('.pathway-card')) {
        const art = card.querySelector('.pathway-scroll-art');
        if (!art) continue;
        const motion = animate(art, {
          transform: [
            'perspective(800px) translateY(12px) rotateX(12deg) rotateY(-5deg) scale(1.07)',
            'perspective(800px) translateY(-12px) rotateX(-9deg) rotateY(5deg) scale(1.07)',
          ],
        }, { duration: 1, ease: 'linear' });
        const detach = scroll(motion, { container, target: card, offset: ['start end', 'end start'] });
        stop.push(() => { detach(); motion.cancel(); });
      }
    }
    syncMotion();
    preference.addEventListener('change', syncMotion);
    return () => {
      preference.removeEventListener('change', syncMotion);
      stop.forEach(disconnect => disconnect());
    };
  }, [domains]);

  return dashboard;
}
