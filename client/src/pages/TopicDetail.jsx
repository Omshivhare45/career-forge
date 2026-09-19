import { useDSATopic } from '../features/dsa/hooks/useDSATopic';
import { DSATopicLayout } from '../features/dsa/components/DSATopicLayout';

// Thin coordinator for the unified topic page.
// All state, data loading, persistence and challenge logic lives in
// useDSATopic; every rendering path (Checkpoint Module, Love Babbar,
// Striver A2Z, non-coding) is driven by the same DSATopicLayout shell.
const TopicDetail = () => {
  const ctx = useDSATopic();

  return <DSATopicLayout ctx={ctx} />;
};

export default TopicDetail;