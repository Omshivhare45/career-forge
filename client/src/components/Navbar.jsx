import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.png';
import {
  FiMenu, FiX, FiBell, FiSun, FiMoon, FiLogOut, FiSettings,
  FiMap, FiList, FiMessageSquare, FiDownload, FiStar, FiZap,
  FiEye, FiShield, FiBriefcase, FiCode, FiChevronDown
} from 'react-icons/fi';
import { MdOutlineDashboard } from 'react-icons/md';

const Navbar = ({ isAdmin, isScrolled = false, isVisible = true, isCompact = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('careerforge_theme') || 'light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
  const [notification, setNotification] = useState('');
  const [canInstall, setCanInstall] = useState(false);

  const isDsaActive = user?.activeDomain?.slug === 'dsa' || user?.selectedDomain?.slug === 'dsa';

  useEffect(() => {
    if (user) {
      const messages = [
        'Grind until you reach your goals! 💪',
        'Consistency is the key to mastery. 🚀',
        'Every line of code makes you better! 💻',
        'Keep pushing forward, you got this! 🔥',
        'Small steps every day lead to big results! 📈',
      ];
      setNotification(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, [user]);

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('careerforge_theme') || 'light');
    };
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  useEffect(() => {
    const checkPrompt = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      setCanInstall(!isStandalone);
    };
    checkPrompt();
    window.addEventListener('pwa-prompt-change', checkPrompt);
    return () => window.removeEventListener('pwa-prompt-change', checkPrompt);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsNotifMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('careerforge_theme', nextTheme);
    window.dispatchEvent(new Event('themechange'));
  };

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      await promptEvent.userChoice;
      window.deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-prompt-change'));
    } else {
      window.dispatchEvent(new CustomEvent('pwa-show-instructions'));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <MdOutlineDashboard /> },
    ...(isDsaActive ? [{ name: 'DSA Practice', path: '/roadmap', icon: <FiCode className="text-emerald-400" /> }] : []),
    { name: 'Zero to Coding', path: '/zero-to-coding', icon: <FiZap className="text-amber-400" /> },
    { name: 'B.Tech Academics', path: '/academics', icon: <FiBookOpen /> },
    { name: 'Roadmaps', path: '/roadmap', icon: <FiMap /> },
    { name: 'Domains', path: '/domains', icon: <FiList /> },
    { name: 'Code Guru', path: '/code-guru', icon: <FiMessageSquare /> },
    { name: 'Jobs', path: '/jobs', icon: <FiBriefcase /> },
    { name: 'Feedback', path: '/feedback', icon: <FiStar /> },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin', icon: <MdOutlineDashboard /> },
  ];

  let links = [...(isAdmin ? adminLinks : studentLinks)];
  if (user?.role === 'admin') {
    if (isAdmin) {
      links.push({ name: 'View as Student', path: '/dashboard', icon: <FiEye className="text-[var(--secondary)]" /> });
    } else {
      links.push({ name: 'Return to Admin', path: '/admin', icon: <FiShield className="text-[var(--brand-orange)]" /> });
    }
  }

  const navHeight = isCompact ? 'h-[56px]' : 'h-[68px]';

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 px-3 sm:px-5 lg:px-8 ${navHeight}`}
      >
        <div
          className={`mx-auto max-w-[1600px] h-full flex items-center justify-between px-3 sm:px-5 rounded-2xl transition-all duration-500 ${
            isScrolled || isCompact
              ? 'glass-nav shadow-lg shadow-black/5 mt-2'
              : 'glass-nav-subtle mt-3'
          }`}
        >
          {/* Left: Logo */}
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]/80 rounded-xl transition-all"
              aria-label="Open menu"
            >
              <FiMenu className="text-xl" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group outline-none">
              <motion.img
                whileHover={{ scale: 1.06, rotate: 2 }}
                transition={{ type: 'spring', stiffness: 400 }}
                src={logoImg}
                alt="CareerForge Logo"
                className="w-9 h-9 rounded-xl shadow-md shrink-0 object-cover ring-2 ring-[var(--primary)]/20"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-black tracking-tight text-[var(--text-main)] leading-none">
                  <span className="text-logo-gradient">CareerForge</span>
                </h1>
                <div className="text-[8px] font-black text-[var(--secondary)] uppercase tracking-[0.25em] mt-0.5">
                  {isCompact ? 'Code Workspace' : 'Geek in Training'}
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {links.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 px-3 xl:px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-colors duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-emerald-600 rounded-xl shadow-md shadow-[var(--primary)]/25"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 text-base">{link.icon}</span>
                    <span className="relative z-10 whitespace-nowrap">{link.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]/80 rounded-xl transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <FiSun className="text-lg text-amber-400" />
              ) : (
                <FiMoon className="text-lg text-indigo-500" />
              )}
            </motion.button>

            {!isCompact && canInstall && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black transition-all"
              >
                <FiDownload className="text-sm animate-float-subtle" />
                <span className="hidden md:inline">Install</span>
              </motion.button>
            )}

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setIsNotifMenuOpen(!isNotifMenuOpen);
                  setHasUnreadNotif(false);
                }}
                className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]/80 rounded-xl transition-all"
              >
                <FiBell className="text-lg" />
                {hasUnreadNotif && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse ring-2 ring-[var(--bg-card)]" />
                )}
              </button>

              <AnimatePresence>
                {isNotifMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-72 bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
                        <h3 className="text-sm font-black text-[var(--text-main)]">Notifications</h3>
                      </div>
                      <div className="px-4 py-3 hover:bg-[var(--bg-sub)]/50 transition-colors border-l-2 border-[var(--primary)]">
                        <p className="text-xs font-bold text-[var(--text-main)] mb-1">
                          Welcome back, {user?.fullName?.split(' ')[0]}!
                        </p>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{notification}</p>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative border-l border-[var(--border)] pl-1.5 sm:pl-2 ml-0.5">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-[var(--bg-sub)]/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-black text-[var(--text-main)] leading-none flex items-center gap-0.5">
                    {user?.fullName?.split(' ')[0] || 'User'}
                    <FiChevronDown className={`text-[10px] transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </p>
                  <p className="text-[8px] text-[var(--secondary)] font-black uppercase tracking-widest mt-0.5">
                    {user?.xp || 0} XP
                  </p>
                </div>
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      className="absolute right-0 mt-2 w-52 bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden py-1"
                    >
                      <div className="px-4 py-3 border-b border-[var(--border)]">
                        <p className="text-sm font-black text-[var(--text-main)] truncate">{user?.fullName}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]/80 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <MdOutlineDashboard /> Profile
                      </Link>
                      {!isAdmin && (
                        <Link
                          to="/setup-profile"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]/80 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <FiSettings /> Settings
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors text-left border-t border-[var(--border)]"
                      >
                        <FiLogOut /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-72 max-w-[85vw] bg-[var(--bg-card)]/95 backdrop-blur-xl h-full shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-lg" />
                  <span className="text-lg font-black text-logo-gradient">CareerForge</span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[var(--bg-sub)]">
                  <FiX className="text-xl" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
                {links.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <NavLink
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[var(--primary)] to-emerald-600 text-white shadow-lg'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                        }`
                      }
                    >
                      <span className="text-xl">{link.icon}</span>
                      {link.name}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
