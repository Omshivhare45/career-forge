import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiBookOpen, FiArrowRight } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';

const AcademicsHome = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [semRes, branchRes] = await Promise.all([
        api.get('/academics/semesters'),
        api.get('/academics/branches')
      ]);
      setSemesters(semRes.data.data || []);
      setBranches(branchRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load semesters and branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterSelect = (sem) => {
    setSelectedSemester(sem);
    setSelectedBranch(null);
    setShowComingSoon(false);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    if (!branch.isActive) {
      setShowComingSoon(true);
    } else {
      setShowComingSoon(false);
      navigate(`/academics/subjects/${selectedSemester._id}/${branch._id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {semesters.map((sem) => {
              const isSelected = selectedSemester?._id === sem._id;
              return (
                <motion.div
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
                </motion.div>
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {branches.map((branch) => {
                  const isSelected = selectedBranch?._id === branch._id;
                  return (
                    <motion.div
                      key={branch._id}
                      whileHover={{ y: -4 }}
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
                    </motion.div>
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
