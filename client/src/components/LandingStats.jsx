import useCountUp from '../hooks/useCountUp';

const stats = [
  [5, '', 'Active domains'],
  [350, '+', 'DSA questions'],
  [300, '+', 'Learners'],
  [500, '+', 'Videos'],
  [10, '+', 'Real projects'],
];

export default function LandingStats() {
  const [strip, progress] = useCountUp();
  return (
    <dl ref={strip} aria-label="CareerForge in numbers" className="forge-wrap landing-stats">
      {stats.map(([value, suffix, label]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd><span aria-hidden="true">{Math.floor(value * progress)}{suffix}</span><span className="sr-only">{value}{suffix}</span></dd>
        </div>
      ))}
    </dl>
  );
}
