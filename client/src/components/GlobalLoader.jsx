import { useEffect, useState } from 'react';
import logo from '../assets/logo-sidebar.png';
import './loadingState.css';

export default function GlobalLoader({ fullScreen = true, title = 'Getting your learning space ready' }) {
  const [takingLonger, setTakingLonger] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setTakingLonger(true), 12000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className={'forge-loading ' + (fullScreen ? 'forge-loading--screen' : '')}>
      <div className="forge-loading__mark" aria-hidden="true">
        <span className="forge-loading__ring" />
        <img src={logo} alt="" width="48" height="48" />
        <span className="forge-loading__spark" />
      </div>
      <div role="status" aria-live="polite" aria-atomic="true">
        <p className="forge-loading__brand">CareerForge</p>
        <h2>{title}</h2>
        <p className="forge-loading__message">
          {takingLonger
            ? 'This is taking longer than usual. Check your connection if it continues.'
            : 'One moment while we load this page.'}
        </p>
      </div>
      <p className="forge-loading__tip">A little practice, a little progress. Every day.</p>
    </div>
  );
}
