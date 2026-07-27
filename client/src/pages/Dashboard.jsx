import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiTarget, FiAward, FiClock, FiActivity, FiArrowRight, FiCalendar, FiBook, FiChevronRight, FiZap, FiStar, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { analyzeDsaProfile, getDsaBadgeForLevel, getStreakRank } from '../utils/dsaPersonalization';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [activeBadgeTab, setActiveBadgeTab] = useState('unlocked');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/progress/dashboard');
      setData(res.data.data);
      
      const certRes = await api.get('/certificates/my');
      setCertificates(certRes.data.data);

      const badgesRes = await api.get('/badges');
      setAllBadges(badgesRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--primary)] border-t-transparent"></div>
    </div>
  );

  if (!data || !data.user) return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="text-5xl mb-6">⚠️</div>
      <h2 className="text-2xl font-black text-[var(--text-main)] mb-2">Something went wrong</h2>
      <p className="text-[var(--text-muted)] mb-8">We couldn't load your journey data. Try refreshing the page.</p>
      <button onClick={() => window.location.reload()} className="btn-primary px-8 py-3">Refresh Page</button>
    </div>
  );

  const { user, currentPhaseData, upcomingAssessment, testsPassed, totalBadges, activityLog } = data;
  const isDsa = user.selectedDomain?.slug === 'dsa';
  const dsaAnalysis = isDsa ? (user.profile?.onboardingAnswers?.dsaAnalysis || analyzeDsaProfile(user.profile?.onboardingAnswers || {})) : null;
  const streakRank = getStreakRank(user.dailyStreak || 0);
  const dsaBadge = getDsaBadgeForLevel(user.currentPhase || 0);

  if (!user.selectedDomain) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6 min-h-[80vh]">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-[var(--primary-light)] text-[var(--primary)] rounded-3xl flex items-center justify-center text-5xl mb-10 shadow-xl"
        >
          🚀
        </motion.div>
        <h2 className="text-4xl font-black text-[var(--text-main)] mb-6 tracking-tight">Ready to start your adventure?</h2>
        <p className="text-[var(--text-muted)] max-w-lg mx-auto mb-12 text-lg leading-relaxed font-semibold">
          Your developer journey begins with a single choice. Pick a domain and let our AI guide you from rookie to architect.
        </p>
        <Link to="/domains" className="btn-primary text-lg px-12 py-4 shadow-xl shadow-indigo-500/20">Forge My Path</Link>
      </div>
    );
  }



  const getLastNDays = (n) => {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const recentDays = getLastNDays(14);

  const earnedMap = new Map(user.earnedBadges?.map(eb => [eb.badgeId?._id || eb.badgeId, eb]) || []);

  const unlockedBadges = allBadges.filter(b => earnedMap.has(b._id));
  const lockedBadges = allBadges.filter(b => !earnedMap.has(b._id));

  // Determine upcoming achievements: next 3 locked badges.
  const upcomingAchievements = lockedBadges
    .filter(b => b.domainId?._id === user.selectedDomain?._id || b.domainId === user.selectedDomain?._id)
    .slice(0, 3);

  // Fallback if less than 3
  if (upcomingAchievements.length < 3) {
    const fallbackBadges = lockedBadges.filter(b => !upcomingAchievements.some(ua => ua._id === b._id)).slice(0, 3 - upcomingAchievements.length);
    upcomingAchievements.push(...fallbackBadges);
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 lg:px-10 transition-colors duration-300">
      
      {/* Dynamic Welcome Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="px-3 py-1 bg-green-100 text-[var(--brand-green)] rounded-full text-[9px] font-black uppercase tracking-wider border border-green-200">
              Level {user.currentPhase || 0} Geek
            </div>
            <div className="px-3 py-1 bg-orange-100 text-[var(--brand-orange)] rounded-full text-[9px] font-black uppercase tracking-wider border border-orange-200">
              {user.profile?.roadmapType || 'Steady Pace'}
            </div>
            <div className="px-3 py-1 bg-purple-100 text-[var(--brand-purple)] rounded-full text-[9px] font-black uppercase tracking-wider border border-purple-200">
              {user.profile?.estimatedTimeline || '6 Months'}
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-main)] mb-2 tracking-tight">
            Your <span className="text-[var(--brand-green)]">Tech Career</span> Journey
          </h1>
          <p className="text-[var(--text-muted)] font-extrabold text-lg">"Welcome back, {user.fullName.split(' ')[0]}. You're on the {user.profile?.roadmapType} path. ⚡"</p>
        </div>
        
        {/* User Stats Card */}
        <div className="flex items-center gap-6 bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl shadow-sm">
          <div className="text-center border-r border-[var(--border)] pr-6">
            <div className="text-[9px] text-[var(--text-light)] uppercase font-black tracking-widest mb-1">XP Earned</div>
            <div className="text-2xl font-black text-[var(--text-main)]">
              {user.totalXP || user.xp || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-[var(--text-light)] uppercase font-black tracking-widest mb-1">Streak</div>
            <div className="text-2xl font-black text-amber-500 flex items-center gap-1.5">
              <FiZap fill="currentColor" /> {parseInt(localStorage.getItem('dsa_streak') || '0', 10) > 0 
                ? parseInt(localStorage.getItem('dsa_streak') || '0', 10) 
                : (user.dailyStreak || 0)}
            </div>
          </div>
        </div>
      </div>
      
      {/* B.Tech Academics Invitation Card */}
      <div className="mb-10 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 p-8 rounded-3xl border border-green-200 shadow-[var(--shadow-soft)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-green-200 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-200 rounded-full blur-3xl opacity-50"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-5 relative z-10 text-center md:text-left">
          <div className="w-14 h-14 bg-[var(--bg-card)] border border-green-200 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0">
            🎓
          </div>
          <div>
            <div className="inline-block px-2.5 py-0.5 bg-green-100 text-[var(--brand-green)] text-[9px] font-black uppercase tracking-wider rounded-lg mb-1.5 border border-green-200">
              University Syllabus
            </div>
            <h2 className="text-xl font-black text-[var(--land-text)] tracking-tight">B.Tech Academics</h2>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-1">
              Study university subjects chapter-wise through structured video lectures, playlist sidebar, and progress tracking.
            </p>
          </div>
        </div>

        <Link 
          to="/academics" 
          className="relative z-10 px-6 py-3.5 bg-[var(--brand-green)] hover:bg-[var(--brand-green-hover)] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          Explore Academics <FiChevronRight strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        {/* Active Quest Card */}
        <div className="card lg:col-span-2 p-8 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--primary)]/5 rounded-full blur-3xl transition-all group-hover:scale-150"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 relative z-10">
            <div className="flex gap-5">
              <div className="w-16 h-16 bg-[var(--bg-sub)] rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-[var(--border)] shrink-0">
                {user.selectedDomain.icon}
              </div>
              <div>
                <div className="text-[var(--primary)] font-black text-[9px] uppercase tracking-widest mb-1.5">Current Mission Map</div>
                <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight mb-1.5">
                  {user.selectedDomain.name?.toLowerCase().includes('web development') ? 'Full Stack Web Development' : user.selectedDomain.name}
                </h2>
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-bold text-sm">
                  <FiClock className="text-[var(--primary)]" /> {user.overallProgress}% Complete
                </div>
              </div>
            </div>
            <Link to="/roadmap" className="btn-secondary py-3 px-5 rounded-xl font-black text-xs hover:bg-[var(--bg-sub)] shrink-0">
              View Map <FiChevronRight size={14} className="ml-1" />
            </Link>
          </div>
          
          <div className="mb-8 relative z-10">
            <div className="flex justify-between items-end mb-2.5">
              <span className="text-[9px] text-[var(--text-light)] font-black uppercase tracking-widest">Mastery Level Progress</span>
              <span className="text-xs font-black text-[var(--primary)]">Level {user.currentPhase || 0} to {user.currentPhase + 1}</span>
            </div>
            <div className="progress-container h-2.5 shadow-inner">
              <div className="progress-bar-fill" style={{ width: `${user.overallProgress}%` }}></div>
            </div>
          </div>

          {currentPhaseData ? (
            <div className="bg-[var(--land-bg-alt)] rounded-2xl p-6 border border-[var(--border-light)] flex flex-col sm:flex-row justify-between items-center gap-6 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] flex items-center justify-center text-[var(--brand-green)] text-xl font-black shadow-[var(--shadow-soft)] shrink-0">
                  {user.currentPhase}
                </div>
                <div>
                  <div className="text-[9px] text-[var(--brand-green)] font-black uppercase tracking-widest mb-0.5">Active Quest</div>
                  <div className="font-black text-[var(--land-text)] text-xl leading-tight">{currentPhaseData.name}</div>
                </div>
              </div>
              <Link to="/roadmap" className="btn-primary py-3 px-8 rounded-xl text-xs shrink-0 shadow-[var(--shadow-bubbly)] hover:-translate-y-1">
                Continue Quest <FiArrowRight strokeWidth={3} className="ml-2" />
              </Link>
            </div>
          ) : (
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200 text-green-700 font-black flex items-center gap-4 shadow-[var(--shadow-soft)]">
              <FiStar className="text-3xl text-green-500 animate-pulse shrink-0" />
              <div>
                <div className="text-xl">Mission Accomplished!</div>
                <div className="text-xs font-bold opacity-80">You've mastered all architectural phases.</div>
              </div>
            </div>
          )}

          {/* DSA Specific Stats - Placement Readiness */}
          {user.selectedDomain?.slug === 'dsa' && (
            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-500/5 to-amber-500/5 rounded-2xl border border-[var(--border)] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <FiZap className="text-8xl text-[var(--primary)]" />
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-6">
                <div>
                   <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
                     <FiAward className="text-amber-500" /> Placement Readiness Rank
                   </h3>
                   <p className="text-[9px] font-black text-[var(--text-light)] mt-1 uppercase tracking-widest">
                     Current Standing: <span className="text-[var(--primary)] font-black">Level {user.currentPhase} {user.currentPhase >= 8 ? 'Beast' : user.currentPhase >= 4 ? 'Warrior' : 'Rookie'}</span>
                   </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-black text-[var(--text-light)] uppercase">Global percentile</div>
                    <div className="text-base font-black text-[var(--primary)]">Top 12%</div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col items-center justify-center shadow-md">
                    <div className="text-lg font-black text-[var(--text-main)]">{Math.min(Math.round((user.dsaStats?.totalProblemsSolved || 0) / 450 * 100), 100)}%</div>
                    <div className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-tighter">Ready</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-sm group">
                  <div className="text-[9px] text-[var(--text-light)] font-black uppercase tracking-widest mb-1 group-hover:text-[var(--primary)] transition-colors">Solved</div>
                  <div className="text-2xl font-black text-[var(--text-main)]">{user.dsaStats?.totalProblemsSolved || 0}</div>
                  <div className="text-[8px] font-bold text-[var(--text-light)] mt-0.5 uppercase">A2Z Problems</div>
                </div>
                <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-sm group">
                  <div className="text-[9px] text-[var(--text-light)] font-black uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Mastered</div>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate">{user.dsaStats?.strongestTopic || 'Foundations'}</div>
                  <div className="text-[8px] font-bold text-[var(--text-light)] mt-0.5 uppercase">High Precision</div>
                </div>
                <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-sm group">
                  <div className="text-[9px] text-[var(--text-light)] font-black uppercase tracking-widest mb-1 group-hover:text-rose-500 transition-colors">Vulnerable</div>
                  <div className="text-xs font-black text-rose-500 truncate">{user.dsaStats?.weakestTopic || 'Recursion'}</div>
                  <div className="text-[8px] font-bold text-[var(--text-light)] mt-0.5 uppercase">Needs Review</div>
                </div>
                <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-sm group">
                  <div className="text-[9px] text-[var(--text-light)] font-black uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors">Next Badge</div>
                  <div className="text-xs font-black text-amber-500 truncate">{dsaBadge.name}</div>
                  <div className="text-[8px] font-bold text-[var(--text-light)] mt-0.5 uppercase">Lvl {user.currentPhase + 1}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mb-6">
                <div className="p-4 bg-[var(--brand-purple)] text-white rounded-xl shadow-[var(--shadow-soft)]">
                  <div className="text-[8px] font-black text-purple-200 uppercase tracking-widest mb-1">AI Recommendation</div>
                  <div className="text-[11px] font-bold leading-relaxed text-purple-50">
                    Practice {dsaAnalysis?.weakTopics?.[0] || user.dsaStats?.weakestTopic || 'Recursion'} next with one tutorial, one dry run, and one accepted submission.
                  </div>
                </div>
                <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                  <div className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-widest mb-1">Streak League</div>
                  <div className={`text-sm font-black ${streakRank.color}`}>{streakRank.name}</div>
                  <div className="text-[8px] font-bold text-[var(--text-light)] mt-0.5 uppercase">{streakRank.next}</div>
                </div>
                <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                  <div className="text-[8px] font-black text-[var(--text-light)] uppercase tracking-widest mb-1">Roadmap Mode</div>
                  <div className="text-sm font-black text-[var(--text-main)]">{dsaAnalysis?.roadmapType || user.profile?.roadmapType}</div>
                  <div className="text-[8px] font-bold text-[var(--text-light)] mt-0.5 uppercase">{dsaAnalysis?.estimatedTimeline || user.profile?.estimatedTimeline}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end text-xs">
                  <div className="flex items-center gap-1">
                    <FiStar className="text-amber-500" />
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">STRIKE MISSION PROGRESS</span>
                  </div>
                  <span className="font-extrabold text-[var(--primary)]">{user.dsaStats?.totalProblemsSolved || 0} / 450 PROBLEMS</span>
                </div>
                <div className="h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((user.dsaStats?.totalProblemsSolved || 0) / 450 * 100, 100)}%` }}
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full shadow-lg"
                  ></motion.div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Level Stats Area */}
        <div className="flex flex-col gap-5">
          <motion.div whileHover={{ y: -4 }} className="card p-6 flex items-center gap-5 border-emerald-500/10 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl shadow-inner shrink-0">
              <FiTarget />
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--text-main)]">{data.completedTopicsCount}</div>
              <div className="text-[9px] text-[var(--text-light)] font-black uppercase tracking-widest">Skills Mastered</div>
            </div>
          </motion.div>
          
          <motion.div whileHover={{ y: -4 }} className="card p-6 flex items-center gap-5 border-amber-500/10 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl shadow-inner shrink-0">
              <FiAward />
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--text-main)]">{testsPassed}</div>
              <div className="text-[9px] text-[var(--text-light)] font-black uppercase tracking-widest">Badges Earned</div>
            </div>
          </motion.div>
          
          <motion.div whileHover={{ y: -4 }} className="card p-6 flex items-center gap-5 border-indigo-500/10 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-xl bg-indigo-500/10 text-[var(--primary)] flex items-center justify-center text-2xl shadow-inner shrink-0">
              <FiStar />
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--text-main)]">
                {user.totalXP || user.xp || 0}
              </div>
              <div className="text-[9px] text-[var(--text-light)] font-black uppercase tracking-widest">Current XP</div>
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
