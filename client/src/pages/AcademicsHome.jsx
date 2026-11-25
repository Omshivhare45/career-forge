import ContentSkeleton from '../components/ContentSkeleton';
import { paths, prefetch } from '../api/curriculum';
import { useCurriculum } from '../hooks/useCurriculum';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGraduationCap } from 'react-icons/fa';

const AcademicsHome = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const semesterList = useCurriculum(paths.semesters);
  const branchList = useCurriculum(paths.branches);
  const semesters = semesterList.data?.data || [];
  const branches = branchList.data?.data || [];
  const selectedSemester = semesters.find(sem => sem._id === params.get('semester'));
  const selectedBranch = branches.find(branch => branch._id === params.get('branch'));
  const showComingSoon = selectedBranch && !selectedBranch.isActive;

  const handleSemesterSelect = sem => setParams({ semester: sem._id });
  const handleBranchSelect = branch => {
    if (branch.isActive) navigate(`/academics/subjects/${selectedSemester._id}/${branch._id}`);
    else setParams({ semester: selectedSemester._id, branch: branch._id });
  };

  if (semesterList.loading || branchList.loading) return <ContentSkeleton title="Loading academics" />;
  if (semesterList.error || branchList.error) return <p role="alert" className="p-6">Could not load semesters and branches.</p>;

  return (
    <div className="fade-in max-w-7xl mx-auto py-12 px-6 lg:px-8">
      {/* Header */}
      <div className="mb-16 text-center max-w-2xl mx-auto">
        <span className="text-xs font-black text-[var(--brand-green)] uppercase tracking-widest bg-[var(--primary-light)] px-3 py-1 rounded-full border border-green-200 flex items-center gap-1.5 w-fit mx-auto">
          <FaGraduationCap /> University Syllabus
        </span>
        <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight mt-4 mb-4">B.Tech Academics</h1>
        <p className="text-lg text-[var(--text-muted)] font-bold leading-relaxed">
          Study semester-wise concepts with interactive video tutorials, chapter-by-chapter playlists, and comprehensive notes.
        </p>
      </div>

      <div className="space-y-12">
        {/* Step 1: Semester Selection */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-black">1</span>
            Select Your Semester
          </h2>
          
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            {semesters.map((sem) => {
              const isSelected = selectedSemester?._id === sem._id;
              return (
                <motion.button
                  type="button"
                  aria-pressed={isSelected}
                  key={sem._id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleSemesterSelect(sem)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer text-center transition-all duration-300 ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] shadow-md'
                      : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary)] text-[var(--text-main)]'
                  }`}
                >
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-black text-lg">{sem.name}</div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Branch Selection */}
        <AnimatePresence>
          {selectedSemester && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6 pt-6 border-t border-[var(--border)]"
            >
              <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-black">2</span>
                Select Your Branch
              </h2>

              <div className="grid grid-cols-1 min-[400px]:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                {branches.map((branch) => {
                  const isSelected = selectedBranch?._id === branch._id;
                  return (
                    <motion.button type="button" aria-pressed={isSelected}
                      key={branch._id}
                      whileHover={{ y: -4 }}
                      onPointerEnter={() => branch.isActive && prefetch(paths.subjects(selectedSemester._id, branch._id))}
                      onFocus={() => branch.isActive && prefetch(paths.subjects(selectedSemester._id, branch._id))}
                      onClick={() => handleBranchSelect(branch)}
                      className={`p-6 rounded-2xl border-2 cursor-pointer text-center transition-all duration-300 ${
                        isSelected
                          ? branch.isActive 
                            ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]' 
                            : 'border-amber-500 bg-amber-50 text-amber-600'
                          : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary)] text-[var(--text-main)]'
                      }`}
                    >
                      <div className="text-2xl mb-2">⚙️</div>
                      <div className="font-black text-lg">{branch.code}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--text-light)] mt-1 font-bold">
                        {branch.name}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Coming Soon UI */}
        <AnimatePresence>
          {showComingSoon && selectedBranch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 md:p-12 rounded-3xl bg-amber-500/5 border-2 border-dashed border-amber-500/20 max-w-2xl mx-auto text-center space-y-4"
            >
              <div className="text-5xl">🚧</div>
              <h3 className="text-2xl font-black text-amber-600 tracking-tight">Coming Soon</h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                Currently, only <strong>Computer Science Engineering (CSE)</strong> content is available for {selectedSemester?.name}.
              </p>
              <p className="text-xs font-bold text-amber-600">
                Support for {selectedBranch.code} will be available in future updates. Keep an eye out!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AcademicsHome;
