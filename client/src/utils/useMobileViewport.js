import { useEffect, useState } from 'react';

export const MOBILE_EDITOR_QUERY =
  '(max-width: 767px), (pointer: coarse) and (max-width: 1024px)';

export const useMobileViewport = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_EDITOR_QUERY).matches
      : false
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_EDITOR_QUERY);
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile;
};
