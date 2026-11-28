import { useState } from 'react';
import { useYouTubePlayer } from '../features/dsa/hooks/useYouTubePlayer';

const playlist = 'PLbtI3_MArDOk_A-GnYHPOiHSxlK2Vd3Zn';
const lessons = [
  ['kkOuRJ69BRY', 'HTML, CSS and JavaScript foundations'],
  ['J_r6hBo9lO4', 'Responsive web development and project'],
  ['a-wVHL0lpb0', 'JavaScript full course'],
  ['1aR7tcmWo_w', 'Master JavaScript: part 2'],
  ['wH6uf20dpAo', 'Advanced JavaScript and projects: part 3'],
  ['GVdBPJzmwQg', 'JavaScript for placements: part 4'],
  ['3LRZRSIh_KE', 'React fundamentals'],
  ['Q5TqsetwCoE', 'Redux Toolkit with a project'],
  ['lVzb6pmel_E', 'TypeScript full course'],
  ['0IciwnJ6PJI', 'Backend development with Node.js, Express and MongoDB'],
  ['NQOAQP0mow0', 'Build a bank transaction system'],
  ['pkKn8q5AvsY', 'Build an authentication system'],
  ['zG3hNL08Dro', 'Build a full-stack generative AI project'],
];

export default function WebDevPlaylist() {
  const [selected, setSelected] = useState(0);
  const [id, title] = lessons[selected];
  useYouTubePlayer({ iframeId: 'webdev-course-video', identity: id, onStateChange: event => {
    if (event.data === 0 && selected < lessons.length - 1) setSelected(selected + 1);
  } });
  return <section aria-labelledby="mern-course-title" className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
    <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div><h2 id="mern-course-title" className="text-2xl font-bold">MERN stack video course</h2>
        <p className="text-sm text-[var(--text-muted)]">Sheryians Coding School · {lessons.length} videos</p></div>
      <a href={'https://www.youtube.com/playlist?list=' + playlist} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--primary)]">Open playlist on YouTube</a>
    </header>
    <div className="grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
      <div><iframe key={id} id="webdev-course-video" className="aspect-video w-full rounded-xl bg-black" src={'https://www.youtube.com/embed/' + id + '?enablejsapi=1'} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        <p className="mt-2 font-semibold">{selected + 1}. {title}</p></div>
      <ol aria-label="Course videos" className="max-h-72 overflow-y-auto space-y-1">
        {lessons.map(([key,label],i) => <li key={key}><button type="button" onClick={() => setSelected(i)} aria-current={selected === i ? 'step' : undefined}
          className="flex w-full gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--bg-sub)] aria-[current=step]:bg-[var(--brand-green-light)] aria-[current=step]:text-[var(--primary)]">
          <span className="tabular-nums">{i+1}</span>{label}</button></li>)}
      </ol>
    </div>
  </section>;
}
