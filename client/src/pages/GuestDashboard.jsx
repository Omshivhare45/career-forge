import { Link } from 'react-router-dom';
import { FiArrowRight, FiBookOpen, FiCode, FiMap } from 'react-icons/fi';

const destinations = [
  { path: '/roadmap', title: 'DSA Curriculum', detail: 'Watch lectures and explore practice problems.', Icon: FiCode },
  { path: '/domains', title: 'Development Roadmaps', detail: 'Explore Full Stack Development and DevOps.', Icon: FiMap },
  { path: '/academics', title: 'Academics', detail: 'Browse subjects, chapters, and lectures.', Icon: FiBookOpen },
  { path: '/ide', title: 'Code Editor', detail: 'Write and edit code in the browser.', Icon: FiCode },
];

export default function GuestDashboard() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-main)]">Explore CareerForge</h1>
      <p className="mt-2 text-[var(--text-muted)]">Browse the curriculum as a guest. Sign in to track your learning and run code.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {destinations.map(({ path, title, detail, Icon }) => (
          <Link key={path} to={path} className="card card-hover p-6 flex items-center gap-4">
            <Icon className="text-[var(--primary)] shrink-0" size={24} />
            <div className="flex-1">
              <h2 className="font-black text-[var(--text-main)]">{title}</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{detail}</p>
            </div>
            <FiArrowRight className="shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
