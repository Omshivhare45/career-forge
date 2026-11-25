import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiBookOpen, FiCode, FiDownload, FiFolder, FiGrid, FiLogOut, FiMap, FiMessageSquare, FiMoon, FiSettings, FiShield, FiStar, FiSun, FiUser, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { loginPath } from '../utils/guestNavigation';
import logo from '../assets/logo-sidebar.png';

const browseLinks = [
  ['/dashboard', 'Dashboard', FiGrid],
  ['/roadmap', 'Roadmaps', FiMap],
  ['/academics', 'Academics', FiBookOpen],
  ['/ide', 'Code Editor', FiCode],
];
const accountLinks = [
  ['/zero-to-coding', 'Zero to Coding', FiZap],
  ['/code-guru', 'Code Guru', FiMessageSquare],
  ['/assessments', 'Assessments', FiStar],
  ['/resources', 'Resources', FiFolder],
  ['/career-guide', 'Career Guide', FiMap],
  ['/jobs', 'Jobs', FiFolder],
  ['/feedback', 'Feedback', FiMessageSquare],
];
const adminLinks = [
  ['/admin', 'Admin Dashboard', FiShield],
  ['/admin/topics', 'Manage Topics', FiBookOpen],
  ['/admin/problems', 'Manage Problems', FiCode],
  ['/admin/submissions', 'Submissions', FiFolder],
  ['/admin/academics', 'Manage Academics', FiBookOpen],
];

export default function ApplicationSidebar({ collapse = false, theme, onThemeChange, onNavigate }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const adminView = location.pathname.split('/')[1] === 'admin' && user?.role === 'admin';
  const links = adminView ? [...adminLinks, ['/dashboard', 'Learner Dashboard', FiGrid]] : [
    ...browseLinks, ...(user ? accountLinks : []),
    ...(user?.role === 'admin' ? [['/admin', 'Administration', FiShield]] : []),
  ];
  const item = 'flex min-h-10 items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-bold';
  const label = (text, style = '') => <span className={collapse ? 'sr-only' : 'min-w-0 truncate ' + style}>{text}</span>;
  const onInstall = async () => {
    const prompt = window.deferredPrompt;
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      window.deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-prompt-change'));
    } else {
      window.dispatchEvent(new Event('pwa-show-instructions'));
    }
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Link to="/" onClick={onNavigate} className="flex h-16 shrink-0 items-center gap-2.5 px-3 font-black" aria-label="CareerForge home">
        <img src={logo} width="32" height="32" className="rounded-lg shrink-0" alt="" />
        {label('CareerForge', 'text-logo-gradient text-xl')}
      </Link>
      <nav aria-label="Main navigation" className="min-h-0 flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {links.map(([path, name, Icon]) => (
          <NavLink key={path} to={path} onClick={onNavigate} title={collapse ? name : undefined}
            end={path === '/admin'}
            className={({ isActive }) => item + ' ' +
              (isActive || (path === '/roadmap' && location.pathname.startsWith('/topic/'))
                || (path === '/dashboard' && location.pathname === '/domains')
                || (path === '/admin' && location.pathname === '/admin/users')
                ? 'bg-[var(--brand-green-light)] text-[var(--brand-green)]'
                : 'text-[var(--land-nav)] hover:bg-[var(--brand-green-light)] hover:text-[var(--brand-green)]')}>
            <Icon size={18} className="shrink-0" />{label(name)}
          </NavLink>
        ))}
      </nav>
      <div className="shrink-0 border-t border-[var(--border)] px-2 py-2 space-y-1">
        <button type="button" className={item + ' w-full hover:bg-[var(--bg-sub)]'} title={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
          onClick={onThemeChange}>
          {theme === 'dark' ? <FiSun size={18} className="shrink-0" /> : <FiMoon size={18} className="shrink-0" />}
          {label(theme === 'dark' ? 'Light mode' : 'Dark mode')}
        </button>
        <button type="button" className={item + ' w-full hover:bg-[var(--bg-sub)]'} title="Install app" onClick={onInstall}>
          <FiDownload size={18} className="shrink-0" />{label('Install app')}
        </button>
        {user ? <>
          <details className="group relative">
            <summary className={item + " list-none cursor-pointer hover:bg-[var(--bg-sub)]"}>
              <FiBell size={18} className="shrink-0" />{label("Notifications")}
            </summary>
            <p className="absolute z-40 bottom-full left-0 w-44 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs shadow-md">
              Welcome, {user.fullName?.split(" ")[0] || "learner"}. Keep building your skills!
            </p>
          </details>
          <Link to="/profile" onClick={onNavigate} className={item + ' hover:bg-[var(--bg-sub)]'} title="Profile">
            <FiUser size={18} className="shrink-0" />{label(user.fullName || 'Profile')}
          </Link>
          <Link to="/setup-profile" onClick={onNavigate} className={item + ' hover:bg-[var(--bg-sub)]'} title="Settings">
            <FiSettings size={18} className="shrink-0" />{label('Settings')}
          </Link>
          <button type="button" className={item + ' w-full hover:bg-[var(--bg-sub)]'} title="Sign out"
            onClick={() => { logout(); onNavigate?.(); navigate('/dashboard', { replace: true }); }}>
            <FiLogOut size={18} className="shrink-0" />{label('Sign out')}
          </button>
        </> : (
          <Link to={loginPath(location)} onClick={onNavigate} className={item + ' bg-[var(--brand-green-light)] text-[var(--brand-green)]'} title="Guest / Sign In">
            <FiUser size={18} className="shrink-0" />{label('Guest / Sign In')}
          </Link>
        )}
      </div>
    </div>
  );
}
