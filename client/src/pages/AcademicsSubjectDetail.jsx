import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiLock, FiUnlock, FiCheckCircle, FiPlay, FiBook } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';

const AcademicsSubjectDetail = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjectAndChapters();
  }, [subjectId]);

  const fetchSubjectAndChapters = async () => {
    try {
      // 1. Fetch semesters and branches to re-create breadcrumbs
      const [subjectsRes, chaptersRes] = await Promise.all([
        api.get('/academics/semesters').then(async (semRes) => {
          const branchesRes = await api.get('/academics/branches');
          const semesters = semRes.data.data;
          const branches = branchesRes.data.data;
          
          // Fetch current subject
          const subjRes = await api.get('/academics/subjects?semesterId=' + semesters[0]._id + '&branchId=' + branches[0]._id);
          // Let's query details by making sure we get the subject from the lists
          return { semesters, branches };
        }),
        api.get(`/academics/chapters?subjectId=${subjectId}`)
      ]);

      // Instead of relying on first semester, let's fetch all subjects in the current semester and find this subject
      // Better yet, let's fetch semesters and search all subject combinations, or we can just fetch the subjects directly from the server.
      // Wait, we have an API GET /api/academics/subjects?semesterId=...&branchId=...
      // Since we don't have the semesterId and branchId in params here, how do we get subject details?
      // Wait! We can get the subject details from the subjects list by scanning all semesters, or we can add a backend route, OR we can query it easily.
      // Actually, let's check: the `getChapters` endpoint returns chapters.
      // Wait, we can fetch all semesters and branches, and find which combination returns our subject! That is a very safe and robust fallback.
      const semesters = subjectsRes.semesters;
      const branches = subjectsRes.branches;
      
      let foundSubject = null;
      let foundSemester = null;
      let foundBranch = null;

      for (const sem of semesters) {
        for (const br of branches) {
          const res = await api.get(`/academics/subjects?semesterId=${sem._id}&branchId=${br._id}`);
          const s = res.data.data.find(x => x._id === subjectId);
          if (s) {
            foundSubject = s;
            foundSemester = sem;
            foundBranch = br;
            break;
          }
        }
        if (foundSubject) break;
      }

      setSubject(foundSubject);
      setChapters(chaptersRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-black text-[var(--text-main)] mb-1">Subject Not Found</h3>
        <button onClick={() => navigate('/academics')} className="btn-primary mt-4 px-6 py-2">Go Back</button>
      </div>
    );
  }

  const overallProgress = subject.totalChapters > 0
    ? Math.round((subject.completedChaptersCount / subject.totalChapters) * 100)
    : 0;

  return (
    <div className="fade-in max-w-5xl mx-auto py-12 px-6 lg:px-8">
      {/* Back button */}
      <button 
        onClick={() => navigate(`/academics/subjects/${subject.semesterId}/${subject.branchId}`)}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-xs uppercase tracking-wider mb-8 transition-colors outline-none cursor-pointer"
      >
        <FiChevronLeft size={16} strokeWidth={3} /> Back to Subjects
      </button>

      {/* Header Detail Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 mb-12 shadow-sm relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--primary)]/5 rounded-full blur-3xl transition-all group-hover:scale-110"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[var(--primary-light)] text-[var(--primary)] rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-green-100 shrink-0">
              {subject.icon || '🎓'}
            </div>
            <div>
              <div className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest mb-1">{subject.code} • B.TECH SYLLABUS</div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight">{subject.name}</h1>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-4 bg-[var(--bg-sub)]/50 border border-[var(--border-light)] px-5 py-3 rounded-2xl shadow-inner min-w-[200px] justify-between">
            <div>
              <div className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-widest">Syllabus Completed</div>
              <div className="text-xl font-black text-[var(--text-main)]">{subject.completedChaptersCount} / {subject.totalChapters} Chapters</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-[var(--primary)]">{overallProgress}%</div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-[var(--bg-sub)]/20 rounded-2xl p-5 border border-[var(--border-light)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
            {subject.description || 'Follow this structured module to learn subject concepts, view video lecture series, and build strong fundamentals.'}
          </p>
        </div>
      </div>

      {/* Chapters list */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-wider mb-6 flex items-center gap-2">
          <FiBook /> Subject Chapters
        </h2>

        {chapters.map((chapter) => {
          const isCompleted = chapter.completedStatus;
          const isLocked = chapter.isLocked;
          
          const chapterProgress = chapter.videosCount > 0
            ? Math.round((chapter.completedVideosCount / chapter.videosCount) * 100)
            : 0;

          return (
            <div
              key={chapter._id}
              className={`p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--bg-card)] ${
                isLocked 
                  ? 'border-[var(--border)] opacity-60' 
                  : isCompleted 
                    ? 'border-green-200 hover:border-green-300 hover:shadow-md' 
                    : 'border-[var(--border-light)] hover:border-[var(--primary)] hover:shadow-md'
              }`}
            >
              {/* Lock overlay visual elements */}
              {isLocked && (
                <div className="absolute right-4 top-4 text-slate-400">
                  <FiLock size={20} strokeWidth={2.5} />
                </div>
              )}

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                    isLocked 
                      ? 'bg-slate-100 border-slate-200 text-slate-400' 
                      : isCompleted 
                        ? 'bg-green-100 border-green-200 text-green-700' 
                        : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  }`}>
                    Chapter {chapter.chapterNumber}
                  </span>
                  
                  {isCompleted && (
                    <span className="text-[10px] font-black text-green-600 flex items-center gap-1 uppercase tracking-wider">
                      <FiCheckCircle /> Completed
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">
                  {chapter.name}
                </h3>
                
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed max-w-3xl line-clamp-2">
                  {chapter.description || 'Comprehensive curriculum study covering subject syllabus.'}
                </p>
              </div>

              <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Progress bar and video counts */}
                <div className="flex flex-col justify-center min-w-[140px] bg-[var(--bg-sub)]/30 border border-[var(--border-light)] p-3 rounded-2xl">
                  <div className="flex justify-between text-[8px] font-black text-[var(--text-light)] uppercase tracking-widest mb-1.5">
                    <span>Videos Watch</span>
                    <span>{chapter.completedVideosCount} / {chapter.videosCount}</span>
                  </div>
                  <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-[var(--primary)]'}`}
                      style={{ width: `${chapterProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-[8px] font-bold text-[var(--text-light)] mt-1">{chapterProgress}% watched</span>
                </div>

                {/* Learn / locked action button */}
                {isLocked ? (
                  <button 
                    disabled 
                    className="px-5 py-3 rounded-xl border border-slate-200 text-slate-400 bg-slate-50 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <FiLock /> Locked
                  </button>
                ) : (
                  <Link
                    to={`/academics/chapter/${chapter._id}`}
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all text-white ${
                      isCompleted 
                        ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                        : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-green-100'
                    }`}
                  >
                    <FiPlay /> Continue
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AcademicsSubjectDetail;
