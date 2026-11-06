import { useEffect, useRef } from 'react';

const YT_SCRIPT_ID = 'careerforge-youtube-iframe-api';
const YT_API_SRC = 'https://www.youtube.com/iframe_api';

// Module-level promise so the IFrame API script is only requested once, no
// matter how many players mount during the session.
let ytApiPromise = null;

export const loadYouTubeIframeAPI = () => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve, reject) => {
    let settled = false;

    const resolveApi = () => {
      if (settled || !window.YT?.Player) return;
      settled = true;
      resolve(window.YT);
    };

    const rejectApi = (error) => {
      if (settled) return;
      settled = true;
      ytApiPromise = null;
      reject(error);
    };

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') {
        try {
          previousReady();
        } catch {
          // Ignore handlers registered by other parts of the app.
        }
      }
      resolveApi();
    };

    const existingScript =
      document.getElementById(YT_SCRIPT_ID) ||
      document.querySelector(`script[src="${YT_API_SRC}"]`);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = YT_SCRIPT_ID;
      script.src = YT_API_SRC;
      script.async = true;
      script.onerror = () => rejectApi(new Error('Unable to load the YouTube IFrame API'));
      document.head.appendChild(script);
    }

    // The API may already be ready even if the callback has not fired yet.
    resolveApi();
  });

  return ytApiPromise;
};

/**
 * Attaches the YouTube IFrame Player API to an existing, already-rendered
 * iframe and keeps its lifecycle in sync with React.
 *
 * Progress callbacks are only invoked after onReady, so player methods such as
 * getCurrentTime() are never called on a half-initialised player.
 */
export const useYouTubePlayer = ({
  iframeId,
  enabled = true,
  identity = '',
  resumeTime = 0,
  onReady,
  onStateChange,
  onBeforeDestroy,
  onError
}) => {
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const callbacksRef = useRef({ onReady, onStateChange, onBeforeDestroy, onError });
  const resumeRef = useRef(resumeTime);

  // Keep the latest callbacks without re-initialising the player. This effect
  // intentionally has no dependency array: it runs on every render.
  useEffect(() => {
    callbacksRef.current = { onReady, onStateChange, onBeforeDestroy, onError };
    resumeRef.current = resumeTime;
  });

  useEffect(() => {
    if (!enabled || !iframeId) return undefined;

    let cancelled = false;
    let pollTimer = null;
    let attempts = 0;

    const destroyPlayer = (player) => {
      if (!player) return;
      try {
        if (typeof player.destroy === 'function') player.destroy();
      } catch {
        // The iframe may already have been removed by React.
      }
    };

    const initPlayer = async () => {
      let YT;
      try {
        YT = await loadYouTubeIframeAPI();
      } catch (error) {
        if (!cancelled) callbacksRef.current.onError?.(error);
        return;
      }

      if (cancelled || !YT?.Player) return;

      const iframe = document.getElementById(iframeId);
      if (!iframe) return;

      if (playerRef.current) {
        destroyPlayer(playerRef.current);
        playerRef.current = null;
      }
      readyRef.current = false;

      try {
        playerRef.current = new YT.Player(iframeId, {
          events: {
            onReady: (event) => {
              if (cancelled) return;
              readyRef.current = true;
              const player = event.target;

              const seekTo = Number(resumeRef.current);
              if (Number.isFinite(seekTo) && seekTo > 1 && typeof player.seekTo === 'function') {
                try {
                  const duration = typeof player.getDuration === 'function' ? player.getDuration() : 0;
                  if (!duration || seekTo < duration - 1) {
                    player.seekTo(seekTo, true);
                  }
                } catch {
                  // Seeking is best-effort; playback should still continue.
                }
              }

              callbacksRef.current.onReady?.(event);
            },
            onStateChange: (event) => {
              if (cancelled || !readyRef.current) return;
              const player = event.target;
              if (!player || typeof player.getCurrentTime !== 'function') return;
              callbacksRef.current.onStateChange?.(event);
            },
            onError: (event) => {
              if (cancelled) return;
              callbacksRef.current.onError?.(event);
            }
          }
        });
      } catch (error) {
        callbacksRef.current.onError?.(error);
      }
    };

    // React effects can run before the iframe is committed to the DOM. Poll
    // briefly instead of initialising against a missing element.
    const waitForIframe = () => {
      if (cancelled) return;
      if (document.getElementById(iframeId)) {
        initPlayer();
        return;
      }
      if (attempts < 50) {
        attempts += 1;
        pollTimer = window.setTimeout(waitForIframe, 100);
      }
    };

    waitForIframe();

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);

      const player = playerRef.current;
      playerRef.current = null;

      if (readyRef.current && player) {
        try {
          callbacksRef.current.onBeforeDestroy?.(player);
        } catch {
          // Progress persistence is best-effort.
        }
      }
      readyRef.current = false;
      destroyPlayer(player);
    };
  }, [iframeId, enabled, identity]);
};
