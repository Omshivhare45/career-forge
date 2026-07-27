import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiPlay, FiCheck, FiFileText, FiArrowRight, FiBookOpen, FiVideo, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';

const AcademicsChapterDetail = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState(null);
  const [subject, setSubject] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    fetchChapterData();
  }, [chapterId]);

  const fetchChapterData = async () => {
    try {
      // 1. Fetch semesters and branches
      const [semRes, branchRes] = await Promise.all([
        api.get('/academics/semesters'),
        api.get('/academics/branches')
      ]);

      const semesters = semRes.data.data;
      const branches = branchRes.data.data;

      // 2. Fetch videos in chapter
      const videosRes = await api.get(`/academics/videos?chapterId=${chapterId}`);
      const fetchedVideos = (videosRes.data.data || []).sort((a, b) => a.order - b.order);
      setVideos(fetchedVideos);

      // 3. Find parent chapter and subject
      const chaptersList = await Promise.all(
        semesters.flatMap(sem =>
          branches.map(async (br) => {
            const subRes = await api.get(`/academics/subjects?semesterId=${sem._id}&branchId=${br._id}`);
            const subjectsList = subRes.data.data;
            for (const s of subjectsList) {
              const chRes = await api.get(`/academics/chapters?subjectId=${s._id}`);
              const ch = chRes.data.data.find(c => c._id === chapterId);
              if (ch) {
                return { chapter: ch, subject: s };
              }
            }
            return null;
          })
        )
      );

      const foundNode = chaptersList.find(node => node !== null);
      if (foundNode) {
        setChapter(foundNode.chapter);
        setSubject(foundNode.subject);
      }

      // Set active video
      if (fetchedVideos.length > 0) {
        // Query progress to find if there's a lastOpenedVideoId or partial timestamps
        const progressRes = await api.get(`/academics/progress?subjectId=${foundNode?.subject?._id}`);
        const userProgress = progressRes?.data?.data || {};
        
        // Find last watch states for individual videos
        const mappedVideos = fetchedVideos.map(v => {
          const matchingProg = userProgress.watchedVideos?.find(wv => wv.videoId === v._id);
          return {
            ...v,
            completed: matchingProg?.completed || false,
            timestamp: matchingProg?.timestamp || 0,
            watchPercentage: matchingProg?.watchPercentage || 0
          };
        });
        setVideos(mappedVideos);

        const lastOpenedVideoId = userProgress.lastOpenedVideoId;
        const lastOpenedVid = mappedVideos.find(v => v._id === lastOpenedVideoId);
        
        const initialVideo = lastOpenedVid || mappedVideos[0];
        setActiveVideo(initialVideo);
        setElapsedTime(initialVideo.timestamp || 0);

        if (initialVideo.timestamp > 0 && !initialVideo.completed) {
          toast.success(`Resuming lecture from ${formatTime(initialVideo.timestamp)} ⚡`);
        }
      }
    } catch (err) {
      toast.error('Failed to load chapter videos');
    } finally {
      setLoading(false);
    }
  };

  // Automated Watch Session Progress Tracker
  useEffect(() => {
    if (!activeVideo) return;

    // Reset watch timer
    setElapsedTime(activeVideo.timestamp || 0);

    const interval = setInterval(() => {
      // Increment only if tab/window has focus and video is not completed
      if (document.hasFocus() && !activeVideo.completed) {
        setElapsedTime(prev => {
          const next = prev + 1;
          const duration = activeVideo.duration || 600;
          if (next >= duration) {
            handleVideoCompletion();
            clearInterval(interval);
            return duration;
          }
          return next;
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [activeVideo]);

  // Periodic Backend Progress Sync (Every 10 seconds of active watching)
  useEffect(() => {
    if (!activeVideo || activeVideo.completed) return;
    
    if (elapsedTime > 0 && elapsedTime % 10 === 0) {
      const duration = activeVideo.duration || 600;
      const percent = Math.min(Math.round((elapsedTime / duration) * 100), 100);
      saveProgress(elapsedTime, percent, 10, percent >= 100);
    }
  }, [elapsedTime]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const saveProgress = async (timestamp, watchPercentage, timeSpentDelta, completed) => {
    if (!subject || !chapter || !activeVideo || savingProgress) return;
    try {
      await api.post('/academics/progress', {
        subjectId: subject._id,
        chapterId: chapter._id,
        videoId: activeVideo._id,
        timestamp,
        watchPercentage,
        timeSpentDelta,
        completed
      });
      
      // Update local state
      setVideos(prev => prev.map(v => v._id === activeVideo._id ? { ...v, completed, timestamp, watchPercentage } : v));
      setActiveVideo(prev => prev ? { ...prev, completed, timestamp, watchPercentage } : null);
    } catch (e) {
      console.warn("Failed to persist watch progress", e);
    }
  };

  const handleVideoCompletion = async () => {
    toast.success("Lecture completed! 🎓");
    await saveProgress(activeVideo.duration || 600, 100, 10, true);
    
    // Auto next video
    const currentIdx = videos.findIndex(v => v._id === activeVideo._id);
    if (currentIdx !== -1 && currentIdx < videos.length - 1) {
      const nextVid = videos[currentIdx + 1];
      toast.success(`Autoplaying next lecture: ${nextVid.title} 🚀`);
      setActiveVideo(nextVid);
    } else {
      toast.success("Congratulations! You completed the last lecture in this chapter! 🎉");
      fetchChapterData();
    }
  };

  const handleManualComplete = async () => {
    if (activeVideo.completed) return;
    setSavingProgress(true);
    try {
      await saveProgress(activeVideo.duration || 600, 100, 10, true);
      toast.success("Marked as complete!");
      
      const currentIdx = videos.findIndex(v => v._id === activeVideo._id);
      if (currentIdx !== -1 && currentIdx < videos.length - 1) {
        setActiveVideo(videos[currentIdx + 1]);
      } else {
        fetchChapterData();
      }
    } catch (e) {
      toast.error("Failed to mark complete");
    } finally {
      setSavingProgress(false);
    }
  };

  const handleNextVideo = () => {
    const currentIdx = videos.findIndex(v => v._id === activeVideo._id);
    if (currentIdx !== -1 && currentIdx < videos.length - 1) {
      setActiveVideo(videos[currentIdx + 1]);
    }
  };

  const handlePrevVideo = () => {
    const currentIdx = videos.findIndex(v => v._id === activeVideo._id);
    if (currentIdx !== -1 && currentIdx > 0) {
      setActiveVideo(videos[currentIdx - 1]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  if (!chapter || !subject) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-black text-[var(--text-main)] mb-1">Chapter Not Found</h3>
        <button onClick={() => navigate('/academics')} className="btn-primary mt-4 px-6 py-2">Go Back</button>
      </div>
    );
  }

  const completedVideos = videos.filter(v => v.completed).length;
  const chapterProgressPercent = videos.length > 0 ? Math.round((completedVideos / videos.length) * 100) : 0;

  // Google Drive url verification bounds
  const isVideoUnavailable = !activeVideo?.embedLink || activeVideo.embedLink.includes('TEMP_VIDEO');

  return (
    <div className="fade-in max-w-7xl mx-auto py-10 px-6 lg:px-8">
      {/* Back to subjects */}
      <button 
        onClick={() => navigate(`/academics/subject/${subject._id}`)}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-xs uppercase tracking-wider mb-8 transition-colors outline-none cursor-pointer"
      >
        <FiChevronLeft size={16} strokeWidth={3} /> Back to Chapters
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: Video Player, Title, Notes */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navigation Controls */}
          {activeVideo && (
            <div className="flex justify-between items-center bg-[var(--bg-card)] border border-[var(--border)] px-4 py-3 rounded-2xl shadow-sm">
              <button
                onClick={handlePrevVideo}
                disabled={videos.findIndex(v => v._id === activeVideo._id) === 0}
                className="flex items-center gap-2 text-xs font-black uppercase text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <FiArrowLeft strokeWidth={3} /> Previous Video
              </button>
              <span className="text-[10px] font-black text-[var(--text-light)] uppercase tracking-wider">
                Video {videos.findIndex(v => v._id === activeVideo._id) + 1} of {videos.length}
              </span>
              <button
                onClick={handleNextVideo}
                disabled={videos.findIndex(v => v._id === activeVideo._id) === videos.length - 1}
                className="flex items-center gap-2 text-xs font-black uppercase text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next Video <FiArrowRight strokeWidth={3} />
              </button>
            </div>
          )}

          {/* Video Player */}
          {activeVideo ? (
            <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-[var(--border)] shadow-lg relative flex flex-col justify-between">
              
              {isVideoUnavailable ? (
                // Google Drive Unavailable Banner (No crashing)
                <div className="flex-1 w-full flex flex-col items-center justify-center text-center p-8 bg-slate-900 text-slate-350 select-none">
                  <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center text-3xl mb-4">
                    ⚠️
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider mb-2">Video is currently unavailable.</h3>
                  <p className="text-xs font-semibold text-slate-400">Please contact your instructor.</p>
                </div>
              ) : (
                // Google Drive Embed Preview iframe
                <iframe
                  id="academics-video-iframe"
                  src={activeVideo.embedLink}
                  className="flex-1 w-full"
                  frameBorder="0"
                  allow="autoplay"
                  allowFullScreen
                ></iframe>
              )}

              {/* Progress Slider (Required for user manual seeking/resuming and timer representation) */}
              <div className="bg-slate-950 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-450 uppercase mb-1.5 tracking-wider">
                    <span className="text-slate-400">Elapsed Time: {formatTime(elapsedTime)} / {formatTime(activeVideo.duration || 600)}</span>
                    <span className="text-green-400">{Math.round((elapsedTime / (activeVideo.duration || 600)) * 100) || 0}% Watched</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={activeVideo.duration || 600}
                    value={elapsedTime}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setElapsedTime(val);
                      const percent = Math.min(Math.round((val / (activeVideo.duration || 600)) * 100), 100);
                      saveProgress(val, percent, 0, percent >= 100);
                    }}
                    className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                </div>
              </div>

            </div>
          ) : (
            <div className="aspect-video bg-slate-900 rounded-3xl flex items-center justify-center border border-[var(--border)] text-slate-400">
              No videos available in this chapter
            </div>
          )}

          {/* Active Lecture Details */}
          {activeVideo && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-[var(--border-light)]">
                <div>
                  <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest bg-[var(--primary-light)] px-2.5 py-1 rounded-lg border border-green-200">
                    Active Video ({activeVideo.videoType || 'Google Drive'})
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] mt-3 tracking-tight">
                    {activeVideo.title}
                  </h2>
                </div>
                
                <div className="flex gap-3">
                  {activeVideo.notesUrl && (
                    <a 
                      href={activeVideo.notesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[var(--bg-sub)] hover:bg-[var(--border)] text-[var(--text-main)] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-[var(--border)] transition-all cursor-pointer"
                    >
                      <FiFileText /> Download Notes
                    </a>
                  )}

                  <button
                    onClick={handleManualComplete}
                    disabled={activeVideo.completed || savingProgress}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                      activeVideo.completed
                        ? 'bg-green-100 border border-green-200 text-green-700 cursor-default'
                        : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {activeVideo.completed ? <><FiCheck /> Completed</> : 'Mark Complete & Next'}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FiBookOpen /> Lecture Description
                </h4>
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
                  {activeVideo.description || 'No description provided for this video. Watch the lecture to cover university syllabus topics and prepare for semester exams.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Playlist Sidebar */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm flex flex-col h-[600px] relative overflow-hidden">
            
            {/* Header / Progress */}
            <div className="pb-6 border-b border-[var(--border-light)]">
              <span className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-widest">Playlist Progress</span>
              <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight mt-1 mb-3 truncate">
                {chapter.name}
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-[var(--text-light)] uppercase tracking-widest">
                  <span>Completed</span>
                  <span>{completedVideos} / {videos.length} Lectures</span>
                </div>
                <div className="w-full bg-[var(--border-light)] h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${chapterProgressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Videos Scrollable List */}
            <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-2 custom-scrollbar">
              {videos.map((vid, index) => {
                const isActive = activeVideo?._id === vid._id;
                const isDone = vid.completed;
                return (
                  <div
                    key={vid._id}
                    onClick={() => setActiveVideo(vid)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden group ${
                      isActive
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                        : 'border-[var(--border-light)] hover:border-[var(--border)] bg-[var(--bg-sub)]/10 hover:bg-[var(--bg-sub)]/30'
                    }`}
                  >
                    {/* Index or Completed Checkmark */}
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                      isDone
                        ? 'bg-green-500 text-white shadow-sm'
                        : isActive
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--border-light)] text-[var(--text-light)]'
                    }`}>
                      {isDone ? <FiCheck /> : (index + 1)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-black truncate ${isActive ? 'text-[var(--primary)] font-black' : 'text-[var(--text-main)]'}`}>
                        {vid.title}
                      </h4>
                      <span className="text-[9px] font-bold text-[var(--text-light)] uppercase tracking-wider block mt-0.5">
                        {Math.floor((vid.duration || 600) / 60)} min • {vid.videoType || 'drive'}
                      </span>
                    </div>

                    {isActive && (
                      <div className="w-1.5 h-6 rounded-full bg-[var(--primary)] shrink-0 absolute right-1"></div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AcademicsChapterDetail;
