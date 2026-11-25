import { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiExternalLink, FiLock } from 'react-icons/fi';
import { paths } from '../../api/curriculum';
import { useCurriculum } from '../../hooks/useCurriculum';
import ContentSkeleton from '../../components/ContentSkeleton';
import { loginPath } from '../../utils/guestNavigation';
import SignInPrompt from './SignInPrompt';

const GuestLearningMaterial = () => {
  const { topicId, id } = useParams();
  const Container = id ? 'section' : 'main';
  const location = useLocation();
  const signIn = loginPath({ ...location, pathname: '/topic/' + (topicId || id) });
  const navigate = useNavigate();
  const [videoPrompt, setVideoPrompt] = useState(false);
  const { data, loading, error } = useCurriculum(paths.guestTopic(topicId || id));
  const topic = data?.data;
  if (loading) return <ContentSkeleton title="Loading learning material" />;

  if (!topic) {
    return (
      <Container className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-black text-slate-900">This learning material needs an account</h1>
        <p className="mt-3 font-semibold text-slate-600">Sign in to access material outside the guest preview.</p>
        <Link to={signIn} className="mt-6 inline-flex rounded-xl bg-[var(--brand-green)] px-6 py-3 font-extrabold text-white">Sign In</Link>
        {error?.response?.status === 403 && (
          <SignInPrompt
            signIn={signIn}
            onClose={() => navigate(signIn)}
            title="Sign in to continue"
            message="This level is available after you sign in or create a free account."
          />
        )}
      </Container>
    );
  }

  return (
    <Container className="mx-auto min-h-screen max-w-4xl px-5 py-10 sm:px-8">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-600 transition hover:text-[var(--brand-green)]">
        <FiArrowLeft /> Back to roadmap
      </button>
      <article className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-7 flex items-center gap-3 text-[var(--brand-green)]">
          <FiBookOpen size={22} />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Guest learning material</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">{topic.title}</h1>
        {topic.description && <p className="mt-4 text-base font-semibold leading-relaxed text-slate-600">{topic.description}</p>}

        {topic.theoryNotes ? (
          <section className="mt-8 rounded-2xl bg-slate-50 p-5 sm:p-7" aria-label="Written lesson">
            <h2 className="mb-4 text-lg font-black text-slate-900">Written lesson</h2>
            <div className="whitespace-pre-wrap break-words text-sm font-medium leading-7 text-slate-700">{topic.theoryNotes}</div>
          </section>
        ) : (
          <p className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">There are no written notes for this topic yet.</p>
        )}

        {topic.textResources?.length > 0 && (
          <section className="mt-8" aria-labelledby="guest-text-resources">
            <h2 id="guest-text-resources" className="mb-3 text-lg font-black text-slate-900">Text resources</h2>
            <div className="flex flex-wrap gap-3">
              {topic.textResources.map((resource) => (
                <a
                  key={`${resource.label}-${resource.url}`}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
                >
                  {resource.label} <FiExternalLink />
                </a>
              ))}
            </div>
          </section>
        )}

        {topic.hasVideo && (
          <button
            type="button"
            onClick={() => setVideoPrompt(true)}
            className="mt-8 flex w-full items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-left transition hover:border-orange-400"
          >
            <span>
              <span className="block font-black text-slate-900">Video lesson</span>
              <span className="mt-1 block text-sm font-semibold text-slate-600">Sign in to watch this video.</span>
            </span>
            <FiLock className="shrink-0 text-xl text-orange-600" />
          </button>
        )}
      </article>
      {videoPrompt && (
        <SignInPrompt
          signIn={signIn}
          onClose={() => setVideoPrompt(false)}
          title="Sign in to watch the video"
          message="Written learning materials are available to guests. Sign in or create a free account to watch video lessons."
        />
      )}
    </Container>
  );
};

export default GuestLearningMaterial;
