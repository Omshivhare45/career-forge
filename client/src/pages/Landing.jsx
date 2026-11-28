import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiBarChart2, FiCompass, FiLayers, FiMap, FiMenu, FiPause, FiPlay, FiX, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo-sidebar.png';
import GuestExplorePipeline from '../pipelines/guestExplore/GuestExplorePipeline';
import GoogleSignInButton from '../components/GoogleSignInButton';
import LandingStats from '../components/LandingStats';
import LandingPathways, { LandingFooter } from '../components/LandingPathways';
import './landingOrbit.css';

const sections = ['Courses & Roadmaps', 'Tutorials', 'Practice'];
const features = [
  [FiMap, '14+ structured roadmaps'],
  [FiZap, 'Interactive AI mentorship'],
  [FiAward, 'Industry verified badges'],
  [FiBarChart2, 'Real-time skill tracking'],
];

function OrbitScene() {
  const stage = useRef(null);
  const [paused, setPaused] = useState(false);

  function tilt(event) {
    if (paused || event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    stage.current.style.setProperty('--yaw', (x * 13) + 'deg');
    stage.current.style.setProperty('--pitch', (-y * 11) + 'deg');
  }
  function center() {
    stage.current.style.removeProperty('--yaw');
    stage.current.style.removeProperty('--pitch');
  }

  return (
    <div className="orbit-scene" data-paused={paused} onPointerMove={tilt} onPointerLeave={center}>
      <div className="orbit-depth" ref={stage}>
        <div className="orbit-halo" aria-hidden="true" />
        <div className="orbit-track orbit-track-a" aria-hidden="true"><i /></div>
        <div className="orbit-track orbit-track-b" aria-hidden="true"><i /></div>
        <div className="orbit-track orbit-track-c" aria-hidden="true" />
        <img className="orbit-astronaut" src="/images/forge-orbit-hero.webp" alt="A floating astronaut balances a coral-red brain above one hand." width="1254" height="1254" fetchPriority="high" draggable="false" />
      </div>
      <div className="orbit-note orbit-note-mind" aria-hidden="true"><span />Independent thinking</div>
      <div className="orbit-note orbit-note-build" aria-hidden="true"><span />Hands-on learning</div>
      <button className="orbit-motion" type="button" aria-label={paused ? 'Play animation' : 'Pause animation'} title={paused ? 'Play animation' : 'Pause animation'} onClick={() => { center(); setPaused(!paused); }}>
        {paused ? <FiPlay /> : <FiPause />}
      </button>
    </div>
  );
}

export default function Landing() {
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const header = useRef(null);
  const menuButton = useRef(null);
  const guestTrigger = useRef(null);

  useEffect(() => { document.documentElement.classList.remove('dark'); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function keydown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    function outside(event) {
      if (!header.current?.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener('keydown', keydown);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('pointerdown', outside);
    };
  }, [menuOpen]);

  function previewRoadmap(event) {
    guestTrigger.current = menuOpen ? menuButton.current : event.currentTarget;
    setMenuOpen(false);
    setGuestOpen(true);
  }
  function closePreview() {
    setGuestOpen(false);
    guestTrigger.current?.focus();
  }

  return (
    <div className="forge-landing">
      <header ref={header} className="forge-header">
        <div className="forge-wrap forge-nav">
          <Link to="/" className="forge-wordmark" aria-label="CareerForge home"><img src={logo} alt="" />CareerForge</Link>
          <nav className="forge-nav-links" aria-label="Learning navigation">
            {sections.map(label => <a key={label} href="#roadmaps">{label}</a>)}
          </nav>
          <div className="forge-nav-actions">
            {!isAuthenticated && <Link className="forge-signin" to="/login">Sign in</Link>}
            <Link className="forge-nav-start" to="/dashboard">{isAuthenticated ? 'My dashboard' : 'Get started'}</Link>
            <button className="forge-menu-toggle" type="button" ref={menuButton} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="forge-menu" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
          {menuOpen && <nav className="forge-menu" id="forge-menu" aria-label="Mobile navigation">
            {sections.map(label => <a key={label} href="#roadmaps" onClick={() => setMenuOpen(false)}>{label}</a>)}
            {!isAuthenticated && <><button type="button" onClick={previewRoadmap}>Preview a roadmap</button><Link to="/login">Sign in</Link></>}
            <Link to="/dashboard">{isAuthenticated ? 'My dashboard' : 'Explore as guest'}</Link>
          </nav>}
        </div>
      </header>
      <main>
        <section className="forge-sky" aria-labelledby="forge-title">
          <div className="forge-stars" aria-hidden="true" />
          <div className="forge-wrap forge-hero">
            <div className="forge-intro">
              <p className="forge-kicker"><span /> Your tech learning platform</p>
              <h1 id="forge-title">Build your<br /><em>tech career.</em></h1>
              <p className="forge-lead">{isAuthenticated && user?.selectedDomain?.name ? <>Keep building your skills in {user.selectedDomain.name} with interactive roadmaps and AI mentorship.</> : <>Master data structures, web development, and AI with interactive roadmaps and hands-on practice.</>}</p>
              <div className="forge-hero-actions" id="get-started">
                <Link className="forge-button forge-primary" to="/dashboard"><FiCompass />{isAuthenticated ? 'Continue learning' : 'Explore as guest'}</Link>
                {isAuthenticated ? <a className="forge-button forge-secondary" href="#roadmaps"><FiLayers />Browse roadmaps</a> : <button type="button" className="forge-button forge-secondary" onClick={previewRoadmap}><FiLayers />Preview a roadmap</button>}
              </div>
              {!isAuthenticated && <details className="forge-google"><summary>Sign in to save your progress</summary><div><GoogleSignInButton next="/dashboard" /></div></details>}
            </div>
            <OrbitScene />
          </div>
          <div className="forge-feature-band">
            <ul className="forge-wrap forge-features" aria-label="CareerForge features">
              {features.map(([Icon, title]) => <li key={title}><Icon aria-hidden="true" /><span>{title}</span></li>)}
            </ul>
          </div>
        </section>
        <LandingStats />
        <LandingPathways />
      </main>
      <LandingFooter />
      {guestOpen && <GuestExplorePipeline onClose={closePreview} />}
    </div>
  );
}
