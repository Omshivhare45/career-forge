export default function ContentSkeleton({ title = 'Loading content' }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-6xl space-y-5 px-6 py-10">
      <span className="sr-only">{title}</span>
      <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
        <div className="h-6 w-1/3 rounded-lg bg-[var(--border)]" />
        <div className="h-3 w-2/3 rounded bg-[var(--border-light)]" />
        <div className="h-24 rounded-2xl bg-[var(--bg-sub)]" />
      </div>
    </div>
  );
}
