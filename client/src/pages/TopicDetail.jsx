import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestLearningMaterial from '../pipelines/guestExplore/GuestLearningMaterial';
import { paths } from '../api/curriculum';
import { useCurriculum } from '../hooks/useCurriculum';
import ContentSkeleton from '../components/ContentSkeleton';
import DSAWorkspacePage from '../features/dsa/components/DSAWorkspacePage';

const loadLesson = () => import('../features/dsa/components/TopicLesson');
const TopicLesson = lazy(loadLesson);

export default function TopicDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const signedIn = Boolean(user);
  useEffect(() => { if (signedIn) loadLesson().catch(() => {}); }, [signedIn]);
  const { data, error } = useCurriculum(user ? paths.topic(id) : null);
  const topic = data?.data;
  const dsaDomain = topic?.domainId?.slug === 'dsa' ? topic.domainId._id : null;
  const [lastDomain, setLastDomain] = useState(null);
  if (topic && lastDomain !== dsaDomain) setLastDomain(dsaDomain);

  if (!user) return <div className="h-full overflow-y-auto"><GuestLearningMaterial /></div>;
  if (error) return <p role="alert" className="p-6">Could not load this topic. <Link to="/roadmap" className="underline">Back to roadmap</Link></p>;
  if (dsaDomain || (!topic && lastDomain)) {
    return <DSAWorkspacePage activeTopic={topic} roadmapDomainId={dsaDomain || lastDomain} pending={!topic}
      renderLesson={props => <Suspense fallback={<ContentSkeleton title="Loading lesson" />}>
        <TopicLesson key={id} topic={topic} {...props} />
      </Suspense>} />;
  }
  return topic ? <TopicLesson key={id} topic={topic} /> : <ContentSkeleton title="Loading topic" />;
}
