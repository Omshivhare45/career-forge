import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FiMenu, FiMessageSquare, FiSidebar, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import ApplicationSidebar from './ApplicationSidebar';
import ContentSkeleton from './ContentSkeleton';
import './applicationTheme.css';

const GlobalAiChat = lazy(() => import('./GlobalAiChat'));

export default function Layout() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const drawer = useRef(null);
  const main = useRef(null);
  const editorRoute = /^(?:\/topic\/|\/(?:ide|zero-to-coding)\/?$)/.test(location.pathname);
  const mode = editorRoute ? 'editor' : 'browse';
  const [sidebar, setSidebar] = useState({ editor: true, browse: false });
  const [theme, setTheme] = useState(() => localStorage.getItem('careerforge_theme') || 'light');
  const [chatLoaded, setChatLoaded] = useState(false);
  const collapsed = sidebar[mode];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('careerforge_theme') || 'light');
    window.addEventListener('themechange', syncTheme);
    return () => {
      window.removeEventListener('themechange', syncTheme);
      document.documentElement.classList.remove('dark');
    };
  }, []);
  useEffect(() => {
    drawer.current?.close();
    if (location.hash === '#domains') document.getElementById('domains')?.scrollIntoView();
    else main.current?.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) drawer.current?.close(); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  const switchTheme = () => {
    localStorage.setItem('careerforge_theme', theme === 'dark' ? 'light' : 'dark');
    window.dispatchEvent(new Event('themechange'));
  };
  const chatAvailable = user && !editorRoute && !location.pathname.startsWith('/admin') && location.pathname !== '/code-guru';

  return (
    <div className="careerforge-app flex h-[100dvh] min-w-0 bg-[var(--land-bg-alt)] text-[var(--land-text)]">
      <a className="app-skip-link" href="#main-content">Skip to content</a>
      <aside className={'hidden shrink-0 flex-col border-r border-[var(--border)] bg-[var(--land-bg)] lg:flex ' +
        (collapsed ? 'w-16' : 'w-56 xl:w-60')}>
        <button type="button" onClick={() => setSidebar((value) => ({ ...value, [mode]: !collapsed }))}
          className="m-2 flex min-h-8 items-center gap-2 rounded-lg px-2 text-xs font-bold hover:bg-[var(--bg-sub)]"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed}>
          <FiSidebar size={17} className="shrink-0" />{!collapsed && 'Collapse navigation'}
        </button>
        <ApplicationSidebar collapse={collapsed} theme={theme} onThemeChange={switchTheme} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--land-bg)] px-3 lg:hidden">
          <button type="button" aria-label="Open navigation" onClick={() => drawer.current?.showModal()} className="rounded-lg p-2 hover:bg-[var(--bg-sub)]">
            <FiMenu size={20} />
          </button>
          <span className="text-logo-gradient font-black">CareerForge</span>
          {!loading && !user && <span className="ml-auto text-xs font-bold text-[var(--text-muted)]">Guest</span>}
        </header>
        <main id="main-content" tabIndex={-1} ref={main} className={'min-h-0 min-w-0 flex-1 ' + (editorRoute ? 'overflow-hidden' : 'app-browse overflow-x-hidden overflow-y-auto')}>
          <Suspense key={user?._id || 'guest'} fallback={<ContentSkeleton />}>
            {loading ? <ContentSkeleton title="Restoring your session" /> : <Outlet />}
          </Suspense>
        </main>
      </div>

      <dialog ref={drawer} aria-label="Navigation"
        onClick={(event) => { if (event.target === drawer.current) drawer.current.close(); }}
        className="fixed inset-y-0 left-0 m-0 h-[100dvh] max-h-none w-72 max-w-[85vw] bg-[var(--land-bg)] text-[var(--text-main)] backdrop:bg-black/40 lg:hidden">
        <div className="relative flex h-full flex-col">
          <button type="button" aria-label="Close navigation" onClick={() => drawer.current.close()}
            className="absolute right-2 top-3 rounded-lg p-2 hover:bg-[var(--bg-sub)]"><FiX size={20} /></button>
          <ApplicationSidebar theme={theme} onThemeChange={switchTheme} onNavigate={() => drawer.current.close()} />
        </div>
      </dialog>

      {chatAvailable && (chatLoaded ? <Suspense fallback={null}><GlobalAiChat initiallyOpen /></Suspense> : (
        <button type="button" aria-label="Open Code Guru chat" onClick={() => setChatLoaded(true)}
          className="fixed bottom-5 right-5 z-30 rounded-full bg-[var(--primary)] p-3 text-white shadow-md"><FiMessageSquare size={22} /></button>
      ))}
    </div>
  );
}
