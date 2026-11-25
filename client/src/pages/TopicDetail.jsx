import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDSATopic } from '../features/dsa/hooks/useDSATopic';
import { DSATopicLayout } from '../features/dsa/components/DSATopicLayout';
import { DSAWorkspacePage } from '../features/dsa/components/DSAWorkspacePage';

// Thin coordinator for the unified topic page.
// All state, data loading, persistence and challenge logic lives in
// useDSATopic. DSA topics render inside the new single learning workspace;
// every other domain keeps the classic DSATopicLayout shell.
const TopicWorkspace = () => {
  const ctx = useDSATopic();

  if (ctx.topic && ctx.isDsaDomain) {
    return <DSAWorkspacePage ctx={ctx} />;
  }

  return <DSATopicLayout ctx={ctx} />;
};

export default function TopicDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  return <TopicWorkspace key={(user?._id || "guest") + ":" + id} />;
}