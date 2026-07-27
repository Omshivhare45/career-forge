import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiPlay, FiCheck, FiCheckCircle, FiFileText, FiArrowRight, FiBookOpen } from 'react-icons/fi';
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

  const playerRef = useRef(null);
  const timeTrackingRef = useRef({ lastSavedTime: 0, startTime: Date.now() });

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  useEffect(() => {
    fetchChapterData();
  }, [chapterId]);

  const fetchChapterData = async () => {
    try {
      // 1. Fetch semesters and branches to query subject later
      const [semRes, branchRes] = await Promise.all([
        api.get('/academics/semesters'),
        api.get('/academics/branches')
      ]);

      const semesters = semRes.data.data;
      const branches = branchRes.data.data;

      // 2. Fetch videos in chapter
      const videosRes = await api.get(`/academics/videos?chapterId=${chapterId}`);
      const fetchedVideos = videosRes.data.data || [];
      setVideos(fetchedVideos);

      // 3. Find parent chapter
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

      // Set first video as active if none is active
      if (fetchedVideos.length > 0) {
        // Find last opened video if any, or default to first
        const progressRes = await api.get(`/academics/progress?subjectId=${foundNode?.subject?._id}`);
        const lastOpenedVideoId = progressRes?.data?.data?.lastOpenedVideoId;
        const lastOpenedVid = fetchedVideos.find(v => v._id === lastOpenedVideoId);
        
        setActiveVideo(lastOpenedVid || fetchedVideos[0]);
      }
    } catch (err) {
      toast.error('Failed to load chapter videos');
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract YouTube ID
  const getYouTubeId = (urlOrId) => {
    if (!urlOrId) return '';
    if (urlOrId.length === 11) return urlOrId;
    const match = urlOrId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : urlOrId;
  };

  // Setup YouTube player listener when active video changes
  useEffect(() => {
    if (!activeVideo) return;

    const ytId = getYouTubeId(activeVideo.youtubeId);
    let checkYTInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkYTInterval);

        try {
          if (playerRef.current) {
            playerRef.current.destroy();
            playerRef.current = null;
          }
        } catch (e) {
          console.warn("Error destroying previous player", e);
        }

        timeTrackingRef.current = { lastSavedTime: 0, startTime: Date.now() };

        try {
          playerRef.current = new window.YT.Player('academics-video-iframe', {
            events: {
              onStateChange: (event) => {
                const currentTime = Math.round(event.target.getCurrentTime());
                const duration = Math.round(event.target.getDuration());
                const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

                // 0 is YT.PlayerState.ENDED
                if (event.data === 0) {
                  handleVideoCompletion();
                }

                // Periodically save video progress (when playing/paused)
                if (event.data === 1 || event.data === 2) {
                  const now = Date.now();
                  const timeSpentDelta = Math.round((now - timeTrackingRef.current.startTime) / 1000);
                  timeTrackingRef.current.startTime = now;

                  if (currentTime - timeTrackingRef.current.lastSavedTime >= 5 || event.data === 2) {
                    saveProgress(currentTime, percent, timeSpentDelta, false);
                    timeTrackingRef.current.lastSavedTime = currentTime;
                  }
                }
              },
              onReady: (event) => {
                // Seek to saved position if not completed and was partially watched
                if (activeVideo.timestamp > 0 && !activeVideo.completed) {
                  event.target.seekTo(activeVideo.timestamp, true);
                  toast.success(`Resuming lecture from ${Math.floor(activeVideo.timestamp / 60)}m ${activeVideo.timestamp % 60}s ⚡`);
                }
              }
            }
          });
        } catch (err) {
          console.warn("Failed to instantiate YT.Player:", err);
        }
      }
    }, 1000);

    return () => {
      clearInterval(checkYTInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (e) {}
      }
    };
  }, [activeVideo]);

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
      
      // Update local state for active video completion
      if (completed) {
        setVideos(prev => prev.map(v => v._id === activeVideo._id ? { ...v, completed: true, watchPercentage: 100 } : v));
        setActiveVideo(prev => prev ? { ...prev, completed: true, watchPercentage: 100 } : null);
      }
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
      // Refresh list to see if chapter was marked complete
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

  return (
    <div className="fade-in max-w-7xl mx-auto py-10 px-6 lg:px-8">
      {/* Back button */}
      <button 
        onClick={() => navigate(`/academics/subject/${subject._id}`)}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-xs uppercase tracking-wider mb-8 transition-colors outline-none cursor-pointer"
      >
        <FiChevronLeft size={16} strokeWidth={3} /> Back to Chapters
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: Video Player, Title, Notes */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Video Player */}
          {activeVideo ? (
            <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-[var(--border)] shadow-lg relative">
              <iframe
                id="academics-video-iframe"
                src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.youtubeId)}?enablejsapi=1&rel=0`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
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
                    Active Lecture
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
                    {activeVideo.completed ? <><FiCheck /> Completed</> : 'Mark Complete'}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FiBookOpen /> Chapter Overview
                </h4>
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
                  {chapter.description || 'Welcome to this syllabus lecture. Please watch the complete video series, download notes, and practice the concepts for examination prep.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Playlist Sidebar */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm flex flex-col h-[550px] relative overflow-hidden">
            
            {/* Header / Progress */}
            <div className="pb-6 border-b border-[var(--border-light)]">
              <span className="text-[9px] font-black text-[var(--text-light)] uppercase tracking-widest">Playlist Progress</span>
              <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight mt-1 mb-3">
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
                        {Math.floor(vid.duration / 60)} min
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
