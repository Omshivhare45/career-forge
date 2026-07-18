import React, { useEffect, useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import GlobalAiChat from './GlobalAiChat';

const Layout = ({ isAdmin = false }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('careerforge_theme') || 'light');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen to global theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('careerforge_theme') || 'light');
    };
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    
    // Lodha Group style: Navbar is ONLY visible at the absolute top of the page.
    // It hides immediately when scrolling down and DOES NOT reappear on scroll-up mid-page.
    if (currentScrollY > 60) {
      setIsNavVisible(false);
    } else {
      setIsNavVisible(true);
    }
    
    setIsScrolled(currentScrollY > 10);
  };

  return (
    <div className="flex flex-col bg-[var(--bg-main)] min-h-screen text-[var(--text-main)] transition-colors duration-300 relative overflow-hidden">
      <Navbar isAdmin={isAdmin} isScrolled={isScrolled} isVisible={isNavVisible} />
      <main onScroll={handleScroll} className="flex-1 overflow-y-auto bg-[var(--bg-main)] relative pt-[72px]">
        <Outlet />
      </main>
      <GlobalAiChat />
    </div>
  );
};

export default Layout;
