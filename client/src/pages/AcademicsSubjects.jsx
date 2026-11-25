import ContentSkeleton from '../components/ContentSkeleton';
import { paths, prefetch } from '../api/curriculum';
import { useCurriculum } from '../hooks/useCurriculum';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiCheckCircle, FiPlay } from 'react-icons/fi';

const AcademicsSubjects = () => {
  const { semesterId, branchId } = useParams();
  const navigate = useNavigate();

  const list = useCurriculum(paths.subjects(semesterId, branchId));
  const semesters = useCurriculum(paths.semesters);
  const branches = useCurriculum(paths.branches);
  const semesterName = semesters.data?.data.find(s => s._id === semesterId)?.name;
  const branchCode = branches.data?.data.find(b => b._id === branchId)?.code;
  const subjects = list.data?.data || [];
  if (list.error) return <p role="alert" className="p-6">Could not load subjects.</p>;

  return (
    <div className="fade-in max-w-7xl mx-auto py-12 px-6 lg:px-8">
      {/* Back button */}
      <button 
        onClick={() => navigate('/academics?' + new URLSearchParams({ semester: semesterId, branch: branchId }))}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-xs uppercase tracking-wider mb-8 transition-colors outline-none cursor-pointer"
      >
        <FiChevronLeft size={16} strokeWidth={3} /> Change Semester / Branch
      </button>

      {/* Header */}
      <div className="mb-12">
        <span className="text-[10px] font-black text-[var(--brand-green)] uppercase tracking-widest bg-[var(--primary-light)] px-3 py-1 rounded-full border border-green-200 w-fit">
          {branchCode} • {semesterName}
        </span>
        <h1 className="text-4xl font-black text-[var(--text-main)] mt-3 mb-2 tracking-tight">Academics Curriculum</h1>
        <p className="text-sm font-semibold text-[var(--text-muted)]">
          Select a subject below to view its chapters, video lectures, and track your syllabus progress.
        </p>
      </div>

      {list.loading ? <ContentSkeleton title="Loading subjects" /> : subjects.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-black text-[var(--text-main)] mb-1">No Subjects Found</h3>
          <p className="text-xs text-[var(--text-muted)] font-semibold">There are no subjects configured for this semester and branch yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subject) => {
            const progressPercent = subject.totalChapters > 0 
              ? Math.round((subject.completedChaptersCount / subject.totalChapters) * 100)
              : 0;

            return (
              <motion.div
                key={subject._id}
                whileHover={{ y: -4 }}
                className="bg-[var(--bg-card)] border-2 border-[var(--border-light)] hover:border-[var(--primary-light)] hover:shadow-lg rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Icon & Subject Code */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-green-100 shrink-0">
                      {subject.icon || '🎓'}
                    </div>
                    <span className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-widest bg-[var(--bg-sub)] px-2.5 py-1 rounded-lg border border-[var(--border-light)]">
                      {subject.code}
                    </span>
                  </div>

                  {/* Info */}
                  <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-2 group-hover:text-[var(--primary)] transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-6 line-clamp-3">
                    {subject.description || 'Master the concepts and prepare for university exams with detailed lectures.'}
                  </p>
                </div>

                <div>
                  {/* Progress Section */}
                  <div className="space-y-2 mb-6 bg-[var(--bg-sub)]/30 p-4 rounded-2xl border border-[var(--border-light)]">
                    <div className="flex justify-between text-[10px] font-black text-[var(--text-light)] uppercase tracking-widest">
                      <span>Progress</span>
                      <span>{subject.completedChaptersCount} / {subject.totalChapters} Chapters</span>
                    </div>
                    <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <div className="text-[9px] font-bold text-[var(--text-muted)] flex justify-between">
                      <span>{progressPercent}% Complete</span>
                      {progressPercent === 100 && (
                        <span className="text-[var(--primary)] flex items-center gap-1">
                          <FiCheckCircle /> Mastered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <Link
                    to={`/academics/subject/${subject._id}`}
                    onPointerEnter={() => prefetch(paths.chapters(subject._id))}
                    onFocus={() => prefetch(paths.chapters(subject._id))}
                    className="w-full btn-primary py-3.5 text-xs rounded-xl shadow-[var(--shadow-bubbly)] uppercase tracking-widest font-black flex justify-center items-center gap-2 hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <FiPlay /> Continue Learning
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AcademicsSubjects;
