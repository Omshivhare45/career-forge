import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiBookOpen, FiCode, FiFolder, FiGrid, FiLogOut, FiMap, FiMoon, FiSettings, FiShield, FiSun, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { loginPath } from '../utils/guestNavigation';
import logo from '../assets/logo-sidebar.png';

const browseLinks = [
  ['/dashboard', 'Dashboard', FiGrid],
  ['/roadmap', 'Roadmaps', FiMap],
  ['/ide', 'Code Editor', FiCode],
];
const adminLinks = [
  ['/admin', 'Overview', FiGrid],
  ['/admin/users', 'Users', FiUser],
  ['/admin#analytics', 'Analytics', FiShield],
  ['/admin#domains', 'Domains', FiMap],
  ['/admin#assessments', 'Assessments', FiBookOpen],
  ['/admin#feedback', 'Feedback', FiFolder],
  ['/admin#topics', 'Video links', FiCode],
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
    ...browseLinks,
    ...(user?.role === 'admin' ? [['/admin', 'Administration', FiShield]] : []),
  ];
  const item = 'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium';
  const label = (text, style = '') => <span className={collapse ? 'sr-only' : 'min-w-0 truncate ' + style}>{text}</span>;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Link to="/" onClick={onNavigate} className="app-wordmark flex h-16 shrink-0 items-center gap-2.5 px-3 font-black" aria-label="CareerForge home">
        <img src={logo} width="32" height="32" className="rounded-lg shrink-0" alt="" />
        {label('CareerForge', 'text-logo-gradient text-xl')}
      </Link>
      <nav aria-label="Main navigation" className="app-navigation min-h-0 flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {links.map(([path, name, Icon]) => (
          adminView && path.startsWith('/admin') && (path === '/admin' || path.includes('#')) ?
            <Link key={path} to={path} onClick={onNavigate} title={collapse ? name : undefined}
              aria-current={location.pathname + location.hash === path ? 'page' : undefined}
              className={item + ' text-[var(--land-nav)] hover:bg-[var(--bg-sub)] aria-[current=page]:bg-[var(--brand-green-light)] aria-[current=page]:text-[var(--primary)]'}>
              <Icon size={18} />{label(name)}
            </Link> :
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
        {user ? <>
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
