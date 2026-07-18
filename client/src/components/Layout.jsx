import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import GlobalAiChat from './GlobalAiChat';
import FloatingOrbs from './FloatingOrbs';

const EDITOR_ROUTES = ['/topic/', '/zero-to-coding'];

const Layout = ({ isAdmin = false }) => {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('careerforge_theme') || 'light');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const isEditorRoute = EDITOR_ROUTES.some((route) => location.pathname.startsWith(route.replace(/\/$/, '')) || location.pathname.includes(route));
  const isDsaWorkspace = location.pathname.startsWith('/topic/') || location.pathname === '/roadmap';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('careerforge_theme') || 'light');
    };
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;

    if (isEditorRoute) {
      setIsNavVisible(true);
    } else if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY.current || currentScrollY <= 80) {
      setIsNavVisible(true);
    }

    lastScrollY.current = currentScrollY;
    setIsScrolled(currentScrollY > 10);
  };

  const navPadding = isEditorRoute ? 'pt-[64px]' : 'pt-[76px]';

  return (
    <div className="flex flex-col bg-[var(--bg-main)] min-h-screen text-[var(--text-main)] transition-colors duration-300 relative overflow-hidden">
      {isDsaWorkspace && <FloatingOrbs variant={isEditorRoute ? 'editor' : 'default'} />}

      <Navbar
        isAdmin={isAdmin}
        isScrolled={isScrolled}
        isVisible={isNavVisible}
        isCompact={isEditorRoute}
      />

      <main
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto bg-transparent relative z-10 ${navPadding} ${
          isEditorRoute ? 'overflow-hidden !pt-[64px]' : ''
        }`}
      >
        <Outlet />
      </main>

      {!isEditorRoute && <GlobalAiChat />}
    </div>
  );
};

export default Layout;
