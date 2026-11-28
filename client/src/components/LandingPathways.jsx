import { Link } from 'react-router-dom';
import { FiActivity, FiBox, FiCloud, FiCode, FiCpu, FiGitBranch, FiLayers, FiShield } from 'react-icons/fi';
import logoImg from '../assets/logo-sidebar.png';
import './LandingPathways.css';

const pathways = [
  { title: 'Data Structures & Algorithms', description: 'Master problem solving and ace top tech interviews.', icon: FiGitBranch, detail: FiLayers, accent: '#a8b1ff' },
  { title: 'Full Stack Web Development', description: 'Build scalable web apps from frontend to backend.', icon: FiCode, detail: FiBox, accent: '#f8ae87' },
  { title: 'Data Science & Machine Learning', description: 'Dive into analytics, pandas, and neural networks.', icon: FiActivity, detail: FiCpu, accent: '#88d8e3' },
  { title: 'Cloud Computing & DevOps', description: 'Learn AWS, Docker, Kubernetes and CI/CD pipelines.', icon: FiCloud, detail: FiLayers, accent: '#99d1ff' },
  { title: 'System Design', description: 'Architect highly scalable and distributed systems.', icon: FiLayers, detail: FiCpu, accent: '#bfb0f4' },
  { title: 'Cybersecurity', description: 'Ethical hacking, network security, and cryptography.', icon: FiShield, detail: FiCode, accent: '#9edcc5' },
];

const footerLinks = [
  ['/about', 'About Us'],
  ['/careers', 'Careers'],
  ['/privacy-policy', 'Privacy Policy'],
  ['/contact', 'Contact'],
];

export default function LandingPathways() {
  return (
      <section className="cf-paths" id="roadmaps" aria-labelledby="cf-paths-title">
        <div className="cf-paths__wrap">
          <p className="cf-paths__eyebrow">Learning paths</p>
          <div className="cf-paths__intro">
            <h2 id="cf-paths-title">Choose your <em>pathway.</em></h2>
            <p>Comprehensive, step-by-step guides to master your favorite tech stack.</p>
          </div>
          <div className="cf-paths__grid">
            {pathways.map(({ title, description, icon: Icon, detail: Detail, accent }) => (
              <Link key={title} to="/dashboard#domains" className="cf-path" style={{ '--path-accent': accent }}>
                <div className="cf-path__art" aria-hidden="true">
                  <div className="cf-path__orbit" />
                  <div className="cf-path__assembly">
                    <span className="cf-path__base" />
                    <span className="cf-path__middle" />
                    <span className="cf-path__tile"><Icon /></span>
                    <span className="cf-path__satellite"><Detail /></span>
                  </div>
                </div>
                <div className="cf-path__body">
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="cf-path__action">Explore track</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
  );
}

export function LandingFooter() {
  return (
      <footer className="cf-landing-footer">
        <div className="cf-landing-footer__inner">
          <div className="cf-landing-footer__brand">
            <img src={logoImg} alt="" width="36" height="36" />
            <span>CareerForge</span>
          </div>
          <nav aria-label="Footer" className="cf-landing-footer__links">
            {footerLinks.map(([path, label]) => <Link key={path} to={path}>{label}</Link>)}
          </nav>
          <small>© 2026 All rights reserved.</small>
        </div>
      </footer>
  );
}
