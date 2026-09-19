import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { getDsaLanguageContent, getCheckpointContent } from '../../../utils/dsaContent';
import { getWebDevLanguageContent, getWebDevCheckpointContent } from '../../../utils/webDevContent';
import { getLessonAssessment, normalizeDsaLanguage } from '../../../utils/dsaPersonalization';
import {
  executeSandbox,
  getRank,
  playSoundEffect,
  getYouTubeEmbedUrl,
  appendYTParams,
} from '../utils/dsaExecutor';
import toast from 'react-hot-toast';

// Central hook backing the unified DSA topic learning page.
// Everything that was previously inline state/logic inside the three
// TopicDetail rendering paths now lives here so the UI shell stays a
// single consistent template driven by data.
export const useDSATopic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const getProgressKey = (slug) => {
    if (!slug) return 'dsa';
    const lowercaseSlug = slug.toLowerCase();
    if (lowercaseSlug === 'web-development' || lowercaseSlug === 'webdev') return 'webdev';
    if (lowercaseSlug === 'open-source' || lowercaseSlug === 'opensource') return 'opensource';
    if (lowercaseSlug === 'devops') return 'devops';
    if (lowercaseSlug === 'dsa') return 'dsa';
    return 'dsa';
  };

  const activeDomainSlug = user?.activeDomain?.slug || user?.selectedDomain?.slug || 'dsa';
  const activeDomainKey = getProgressKey(activeDomainSlug);
  const activeDomainProgress = user?.domainsProgress?.[activeDomainKey] || {
    xp: 0,
    currentPhase: 1,
    overallProgress: 0,
    completedTopics: [],
    startedTopics: []
  };

  // Topic state variables
  const [topic, setTopic] = useState(null);
  // Learning flow step state: 1=Video, 2=Assessment/Challenge, 'transition'=overlay
  const [learningStep, setLearningStep] = useState(1);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const playerRef = useRef(null);
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studyTime, setStudyTime] = useState(30);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isCpSidebarOpen, setIsCpSidebarOpen] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('learn');
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const advanceStep = () => setLearningStep(prev => Math.min(prev + 1, 2));
  const isChallengeUnlocked = true;

  const isCompleted = useMemo(() => {
    return activeDomainProgress.completedTopics?.some(t => t.topicId === id || t.topicId?._id === id);
  }, [activeDomainProgress.completedTopics, id]);

  const nextTopic = useMemo(() => {
    if (!topic || allTopics.length === 0) return null;
    const sorted = [...allTopics].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = sorted.findIndex(t => t._id === id);
    if (currentIndex !== -1 && currentIndex < sorted.length - 1) {
      return sorted[currentIndex + 1];
    }
    return null;
  }, [allTopics, id, topic]);

  const prevTopic = useMemo(() => {
    if (!topic || allTopics.length === 0) return null;
    const sorted = [...allTopics].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = sorted.findIndex(t => t._id === id);
    if (currentIndex > 0) {
      return sorted[currentIndex - 1];
    }
    return null;
  }, [allTopics, id, topic]);

  // Persist learning step in localStorage per topic
  useEffect(() => {
    if (!id) return;
    setIsVideoFinished(false);
    if (isCompleted) {
      setLearningStep(2);
    } else {
      const savedStep = localStorage.getItem(`dsa_learning_step_${id}`);
      setLearningStep(savedStep ? parseInt(savedStep, 10) : 1);
    }
  }, [id, isCompleted]);

  // Save learning step when it changes
  useEffect(() => {
    if (!id || learningStep === undefined) return;
    localStorage.setItem(`dsa_learning_step_${id}`, learningStep.toString());
  }, [id, learningStep]);

  // Custom Dynamic Languages & Tracks State
  const [selectedLang, setSelectedLang] = useState(() => normalizeDsaLanguage(localStorage.getItem('dsa_lang') || 'cpp'));
  const [useStriverAdvanced, setUseStriverAdvanced] = useState(() => localStorage.getItem('striver_advanced') === 'true');
  const dsaCourse = useStriverAdvanced ? 'striver' : 'default';

  const langDisplayMap = { cpp: 'C++', java: 'Java', python: 'Python', javascript: 'JavaScript' };
  const currentLangName = langDisplayMap[selectedLang] || 'C++';

  // Interactive Code Playground States
  const [editorCode, setEditorCode] = useState('');
  const [editorTheme, setEditorTheme] = useState('light');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [compilerStatus, setCompilerStatus] = useState('idle'); // 'idle' | 'running' | 'passed' | 'failed' | 'compile_error'
  const [challengePassed, setChallengePassed] = useState(false);
  const [currentTab, setCurrentTab] = useState('problem'); // 'problem' | 'playground'
  const [testResults, setTestResults] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles, setParticles] = useState([]);

  // LeetCode UI Specific States
  const [leftTab, setLeftTab] = useState('description'); // 'description' | 'approach' | 'submissions'
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcase'); // 'testcase' | 'result'
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubCode, setSelectedSubCode] = useState(null);
  const [celebrationData, setCelebrationData] = useState(null);

  // Feedback States
  const [difficultyFeedback, setDifficultyFeedback] = useState('easy');
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [revisionNeeded, setRevisionNeeded] = useState(false);

  // Progressive Question Difficulty State
  const [activeDifficulty, setActiveDifficulty] = useState(() => localStorage.getItem(`dsa_difficulty_${id}`) || 'beginner');
  const [lessonAnswers, setLessonAnswers] = useState({});

  useEffect(() => {
    if (id) {
      setActiveDifficulty(localStorage.getItem(`dsa_difficulty_${id}`) || 'beginner');
      setLessonAnswers({});
    }
  }, [id]);

  // ─── CHECKPOINT MODULE STATE (for "Start Coding" Level 0 & "Arrays Explorer" Level 1) ────
  // Derived dynamically from database metadata
  const CHECKPOINTS = useMemo(() => {
    if (!topic || !topic.checkpoints || topic.checkpoints.length === 0) {
      return ['cp1', 'cp2', 'cp3'];
    }
    return topic.checkpoints.map(cp => cp.id);
  }, [topic]);

  const CHECKPOINT_LABELS = useMemo(() => {
    if (!topic || !topic.checkpoints || topic.checkpoints.length === 0) {
      return {
        cp1: 'Intro to Programming',
        cp2: 'Variables & Conditions',
        cp3: 'Loops & Logic'
      };
    }
    const labels = {};
    topic.checkpoints.forEach(cp => {
      labels[cp.id] = cp.label;
    });
    return labels;
  }, [topic]);

  const CHECKPOINT_ICONS = useMemo(() => {
    if (!topic || !topic.checkpoints || topic.checkpoints.length === 0) {
      return { cp1: '👋', cp2: '🔀', cp3: '🔁' };
    }
    const icons = {};
    topic.checkpoints.forEach((cp, idx) => {
      const emojis = ['👋', '🔀', '🔁', '🧱', '🔍', '🔄', '📐', '🎯', '⚡', '🏆', '💎', '🚀', '🔥', '🧗', '🛠️', '🧬', '🧠', '⚙️', '🌟', '🎖️', '🎨', '🔮', '🗺️', '🏰', '🏹', '🛡️', '⚔️', '👑'];
      icons[cp.id] = emojis[idx % emojis.length];
    });
    return icons;
  }, [topic]);

  const [activeCheckpoint, setActiveCheckpoint] = useState('cp1');
  const [checkpointVideoFinished, setCheckpointVideoFinished] = useState(false);
  const [checkpointCodePassed, setCheckpointCodePassed] = useState(false);
  // Track which checkpoints have been completed for this topic
  const [completedCheckpoints, setCompletedCheckpoints] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`dsa_cp_done_${id}`) || '[]'); } catch { return []; }
  });
  const checkpointPlayerRef = useRef(null);

  useEffect(() => {
    if (id && topic) {
      const firstCp = (topic.checkpoints && topic.checkpoints.length > 0) ? topic.checkpoints[0].id : 'cp1';
      const saved = localStorage.getItem(`dsa_checkpoint_${id}`) || firstCp;

      const urlParams = new URLSearchParams(window.location.search);
      const urlCp = urlParams.get('cp');

      const validCps = topic.checkpoints ? topic.checkpoints.map(cp => cp.id) : ['cp1', 'cp2', 'cp3'];

      if (urlCp && validCps.includes(urlCp)) {
        setActiveCheckpoint(urlCp);
        localStorage.setItem(`dsa_checkpoint_${id}`, urlCp);
      } else if (validCps.includes(saved)) {
        setActiveCheckpoint(saved);
      } else {
        setActiveCheckpoint(firstCp);
        localStorage.setItem(`dsa_checkpoint_${id}`, firstCp);
      }

      setCheckpointVideoFinished(false);
      setCheckpointCodePassed(false);
      try {
        setCompletedCheckpoints(JSON.parse(localStorage.getItem(`dsa_cp_done_${id}`) || '[]'));
      } catch { setCompletedCheckpoints([]); }
    }
  }, [id, topic]);

  const markCheckpointComplete = (cpId) => {
    const updated = completedCheckpoints.includes(cpId) ? completedCheckpoints : [...completedCheckpoints, cpId];
    setCompletedCheckpoints(updated);
    localStorage.setItem(`dsa_cp_done_${id}`, JSON.stringify(updated));
    const idx = CHECKPOINTS.indexOf(cpId);
    if (idx < CHECKPOINTS.length - 1) {
      const next = CHECKPOINTS[idx + 1];
      setActiveCheckpoint(next);
      localStorage.setItem(`dsa_checkpoint_${id}`, next);
      setCheckpointVideoFinished(false);
      setCheckpointCodePassed(false);
      toast.success(`✅ Checkpoint ${idx + 1} done! Now: ${CHECKPOINT_LABELS[next]} 🚀`);
    } else {
      toast.success(`🏆 All ${CHECKPOINTS.length} checkpoints complete! Topic Mastered!`);
    }
  };

  // Current checkpoint index + whether it is the final checkpoint in the topic.
  // isLastCheckpoint comes from the content data itself — no hardcoding.
  // NOTE: resolved AFTER activeCheckpointContent is declared below.
  const currentCpIndex = CHECKPOINTS.indexOf(activeCheckpoint);

  useEffect(() => {
    if (id) {
      localStorage.setItem(`dsa_difficulty_${id}`, activeDifficulty);
    }
  }, [id, activeDifficulty]);

  // Advanced Layout Resizer & Fullscreen Editor States
  const [leftWidth, setLeftWidth] = useState(60); // percentage width for left details pane
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Synchronize Monaco theme with the global page theme on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setEditorTheme(isDark ? 'vs-dark' : 'light');
  }, []);

  // Sync workspace and page theme toggle
  const toggleWorkspaceTheme = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setEditorTheme('light');
      localStorage.setItem('careerforge_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      setEditorTheme('vs-dark');
      localStorage.setItem('careerforge_theme', 'dark');
    }
  }, []);

  // Window mouse resize dragging event listeners
  const startResize = (e) => {
    setIsDragging(true);
    document.body.classList.add('workspace-dragging');
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const container = document.getElementById('workspace-split-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      if (percentage > 20 && percentage < 80) {
        setLeftWidth(percentage);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('workspace-dragging');
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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

  // Sync initial language with user profile onboarding answers
  useEffect(() => {
    if (user?.profile?.onboardingAnswers?.dsa_language) {
      const savedLang = normalizeDsaLanguage(localStorage.getItem('dsa_lang') || user.profile.onboardingAnswers.dsa_language);
      setSelectedLang(savedLang);
    }
  }, [user]);

  // Save selected settings to local persistence
  useEffect(() => {
    localStorage.setItem('dsa_lang', selectedLang);
  }, [selectedLang]);

  useEffect(() => {
    localStorage.setItem('striver_advanced', useStriverAdvanced.toString());
  }, [useStriverAdvanced]);

  // Load topic & dependencies
  useEffect(() => {
    fetchTopic();
    // Scroll back to top on page refresh or navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await api.get(`/progress/submissions/${id}`);
      setSubmissions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  }, [id]);

  const fetchTopic = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/topics/${id}`);
      const fetchedTopic = res.data.data;
      setTopic(fetchedTopic);

      const isWebDev = fetchedTopic?.domainId?.slug === 'web-development' || fetchedTopic?.domainId === 'web-development' ||
                        (typeof fetchedTopic?.domainId === 'object' && fetchedTopic?.domainId?.slug === 'web-development');
      if (isWebDev) {
        const titleLower = (fetchedTopic?.title || '').toLowerCase();
        if (titleLower.includes('html')) {
          setSelectedLang('html');
        } else if (titleLower.includes('css')) {
          setSelectedLang('css');
        } else {
          setSelectedLang('javascript');
        }
      }

      // Reset ALL interactive playground variables on topic navigation
      setChallengePassed(false);
      setCompilerStatus('idle');
      setConsoleLogs([]);
      setTestResults([]);
      setSelectedSubCode(null);
      setEditorCode(''); // Clear editor so boilerplate loads fresh

      // Fetch adjacent topics within active phase for progress listing
      if (res.data.data.phaseId) {
        const phaseRes = await api.get(`/topics/phase/${res.data.data.phaseId._id || res.data.data.phaseId}`);
        setAllTopics(phaseRes.data.data);
      }

      // Automatically register starting topic in backend if not already logged
      const isStarted = activeDomainProgress.startedTopics?.some(t => t.topicId === id || t.topicId?._id === id);
      const isCompletedTopic = activeDomainProgress.completedTopics?.some(t => t.topicId === id || t.topicId?._id === id);

      if (user && !isStarted && !isCompletedTopic) {
        await api.post('/progress/start-topic', { topicId: id });
      }

      // Fetch submissions for submissions history list
      fetchSubmissions();
      if (user) {
        refreshUser();
      }

      if (isCompletedTopic) {
        const completedData = activeDomainProgress.completedTopics?.find(t => t.topicId === id || t.topicId?._id === id);
        if (completedData) {
          setNotes(completedData.notes || '');
          setConfidenceLevel(completedData.confidenceLevel || 3);
          setDifficultyFeedback(completedData.difficultyFeedback || 'easy');
          setRevisionNeeded(completedData.revisionNeeded || false);
        }
      }

    } catch (err) {
      toast.error('Failed to load topic details');
      navigate('/roadmap');
    } finally {
      setLoading(false);
    }
  }, [id, user, activeDomainProgress, fetchSubmissions, refreshUser, navigate]);

  // Dynamic boilerplate loaders
  const isDsaDomain = topic?.domainId?.slug === 'dsa' || topic?.domainId === 'dsa' ||
                      (typeof topic?.domainId === 'object' && topic?.domainId?.slug === 'dsa');
  const isWebDevDomain = topic?.domainId?.slug === 'web-development' || topic?.domainId === 'web-development' ||
                        (typeof topic?.domainId === 'object' && topic?.domainId?.slug === 'web-development');
  const shouldSplitWorkspace = isDsaDomain || isWebDevDomain;

  const availableLanguages = useMemo(() => {
    if (isWebDevDomain) {
      const titleLower = (topic?.title || '').toLowerCase();
      if (titleLower.includes('html')) return ['html'];
      if (titleLower.includes('css')) return ['css'];
      return ['html', 'css', 'javascript'];
    }
    return ['cpp', 'java', 'python', 'javascript'];
  }, [isWebDevDomain, topic]);

  const isCheckpointModule = shouldSplitWorkspace && (topic?.isCheckpointModule === true || (topic?.title || '').toLowerCase() === 'start coding');
  const isCheckpointMode = isCheckpointModule;

  const langContent = useMemo(() => {
    if (isDsaDomain) {
      return getDsaLanguageContent(topic?.title, selectedLang, activeDifficulty, useStriverAdvanced, topic?.youtubeLink, dsaCourse);
    }
    if (isWebDevDomain) {
      return getWebDevLanguageContent(topic?.title, selectedLang, activeDifficulty, topic?.youtubeLink);
    }
    return null;
  }, [isDsaDomain, isWebDevDomain, topic, selectedLang, activeDifficulty, useStriverAdvanced, dsaCourse]);

  const lessonAssessment = shouldSplitWorkspace ? getLessonAssessment(topic?.title, selectedLang) : [];
  const lessonAssessmentComplete = !shouldSplitWorkspace || lessonAssessment.every((_, index) => (lessonAnswers[index] || '').trim().length > 0);

  // Active checkpoint content (only relevant when isCheckpointModule)
  const activeCheckpointContent = useMemo(() => {
    if (!isCheckpointModule) return null;
    if (isDsaDomain) {
      return getCheckpointContent(activeCheckpoint, selectedLang, dsaCourse);
    }
    if (isWebDevDomain) {
      return getWebDevCheckpointContent(activeCheckpoint, selectedLang);
    }
    return null;
  }, [isCheckpointModule, isDsaDomain, isWebDevDomain, activeCheckpoint, selectedLang, dsaCourse]);

  // isLastCheckpoint comes from the content data itself — no hardcoding
  const isLastCp = activeCheckpointContent?.isLastCheckpoint || false;

  // For checkpoint module: use the unique embed URL baked into each checkpoint
  // Each checkpoint has its own pre-built videoEmbedUrl — NEVER the same video twice
  const checkpointVideoEmbedUrl = useMemo(() => {
    if (!isCheckpointModule || !activeCheckpointContent?.videoEmbedUrl) return null;
    return activeCheckpointContent.videoEmbedUrl;
  }, [isCheckpointModule, activeCheckpointContent]);

  const activeVideoEmbedUrl = useMemo(() => {
    if (langContent?.youtubeVideoId) {
      if (langContent.youtubeVideoId.length === 11) {
        let url = `https://www.youtube.com/embed/${langContent.youtubeVideoId}?rel=0&modestbranding=1&showinfo=0`;
        if (langContent.youtubePlaylistId) {
          url += `&list=${langContent.youtubePlaylistId}`;
        }
        return url;
      }
      return getYouTubeEmbedUrl(langContent.youtubeVideoId);
    }
    if (langContent?.youtubePlaylistId) {
      return `https://www.youtube.com/embed/videoseries?list=${langContent.youtubePlaylistId}`;
    }
    if (topic?.youtubeLink) {
      return getYouTubeEmbedUrl(topic.youtubeLink);
    }
    return null;
  }, [langContent, topic]);

  // Hook up YouTube Player state listener for the Striver/guided tutorial player: we mirror the
  // original TopicDetail behavior and instantiate the YT API player whenever the Step-1 video is
  // rendered, regardless of which course track is active.
  useEffect(() => {
    if (!activeVideoEmbedUrl || learningStep !== 1) return;

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

        try {
          playerRef.current = new window.YT.Player('tutorial-video-iframe', {
            events: {
              onStateChange: (event) => {
                // 0 is YT.PlayerState.ENDED
                if (event.data === 0) {
                  setIsVideoFinished(true);
                  toast.success("Tutorial video completed! Assessment is now unlocked! 🔓");
                }

                // Periodically save video progress
                if (event.data === 1 || event.data === 2) {
                  const currentTime = Math.round(event.target.getCurrentTime());
                  api.post('/progress/video-progress', {
                    checkpointId: `tutorial_${id}`,
                    timestamp: currentTime,
                    currentCheckpoint: `tutorial_${id}`,
                    lastOpenedTopic: id
                  }).catch(e => console.warn("Failed to persist video progress", e));
                }
              },
              onReady: (event) => {
                const activeDomainKey = user?.activeDomain?.slug ? getProgressKey(user.activeDomain.slug) : 'dsa';
                const savedProgress = user?.domainsProgress?.[activeDomainKey]?.videoProgress;
                if (savedProgress && savedProgress.checkpointId === `tutorial_${id}` && savedProgress.timestamp > 0) {
                  event.target.seekTo(savedProgress.timestamp, true);
                  toast.success(`Resuming tutorial video from ${Math.floor(savedProgress.timestamp / 60)}m ${savedProgress.timestamp % 60}s ⚡`);
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
  }, [activeVideoEmbedUrl, learningStep, user, id, dsaCourse]);

  // Hook up YouTube Player state listener for checkpoint videos
  useEffect(() => {
    if (!checkpointVideoEmbedUrl || !activeCheckpoint) return;

    let checkYTInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkYTInterval);

        try {
          if (checkpointPlayerRef.current) {
            checkpointPlayerRef.current.destroy();
            checkpointPlayerRef.current = null;
          }
        } catch (e) {
          console.warn("Error destroying previous checkpoint player", e);
        }

        try {
          const domId = `checkpoint-video-${activeCheckpoint}`;
          const iframeEl = document.getElementById(domId);
          if (!iframeEl) return;

          checkpointPlayerRef.current = new window.YT.Player(domId, {
            events: {
              onStateChange: (event) => {
                if (event.data === 0) {
                  setCheckpointVideoFinished(true);
                  toast.success("Checkpoint tutorial video completed! challenge unlocked! 🔓");
                }

                // Periodically save video progress
                if (event.data === 1 || event.data === 2) {
                  const currentTime = Math.round(event.target.getCurrentTime());
                  const progressKey = `${activeDomainKey}_${id}_${activeCheckpoint}`;
                  api.post('/progress/video-progress', {
                    checkpointId: progressKey,
                    timestamp: currentTime,
                    currentCheckpoint: progressKey,
                    lastOpenedTopic: id
                  }).catch(e => console.warn("Failed to persist video progress", e));
                }
              },
              onReady: (event) => {
                const activeDomainKey = user?.activeDomain?.slug ? getProgressKey(user.activeDomain.slug) : 'dsa';
                const savedProgress = user?.domainsProgress?.[activeDomainKey]?.videoProgress;
                if (savedProgress && savedProgress.checkpointId === `${activeDomainKey}_${id}_${activeCheckpoint}` && savedProgress.timestamp > 0) {
                  event.target.seekTo(savedProgress.timestamp, true);
                  toast.success(`Resuming tutorial video from ${Math.floor(savedProgress.timestamp / 60)}m ${savedProgress.timestamp % 60}s ⚡`);
                }
              }
            }
          });
        } catch (err) {
          console.warn("Failed to instantiate checkpoint YT.Player:", err);
        }
      }
    }, 1000);

    return () => {
      clearInterval(checkYTInterval);
      if (checkpointPlayerRef.current) {
        try {
          checkpointPlayerRef.current.destroy();
          checkpointPlayerRef.current = null;
        } catch (e) {}
      }
    };
  }, [checkpointVideoEmbedUrl, activeCheckpoint, user, id, activeDomainKey]);

  // Reset boilerplate when topic, language, or difficulty changes
  useEffect(() => {
    // TEMP DEBUG
    // eslint-disable-next-line no-console
    console.log('[DEBUG bp-effect] deps=', JSON.stringify({ id, selectedLang, activeDifficulty, bp: !!langContent?.editorBoilerplate, bpLen: (langContent?.editorBoilerplate || '').length, langLen: (langContent || null) ? 'obj' : 'null' }));
    if (langContent?.editorBoilerplate) {
      setEditorCode(langContent.editorBoilerplate);
      setTestResults([]);
      setConsoleLogs([]);
      setCompilerStatus('idle');
      setChallengePassed(false);
    }
  }, [id, selectedLang, activeDifficulty, langContent?.editorBoilerplate]);

  // Reset editor boilerplate when the active checkpoint changes
  useEffect(() => {
    if (isCheckpointModule && activeCheckpointContent?.editorBoilerplate) {
      setEditorCode(activeCheckpointContent.editorBoilerplate);
      setTestResults([]);
      setConsoleLogs([]);
      setCompilerStatus('idle');
      setChallengePassed(false);
    }
  }, [isCheckpointModule, activeCheckpoint, activeCheckpointContent?.editorBoilerplate]);

  // Restores a historical submission back into the editor
  const handleLoadSubmission = (subCode, subLang) => {
    setSelectedLang(normalizeDsaLanguage(subLang));
    setEditorCode(subCode);
    toast.success("Loaded past submission code into the editor!");
  };

  // Play confetti animation
  const triggerConfettiExplosion = () => {
    const arr = [];
    const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
    for (let i = 0; i < 60; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * -20 - 10,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 6 + 5
      });
    }
    setParticles(arr);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setParticles([]);
    }, 3000);
  };

  // Shared run-code handler — wired via data so every topic uses the same flow
  const handleRunCode = () => {
    setChallengePassed(false); // CRITICAL BUG FIX: Reset on run
    setCompilerStatus('running');
    setActiveConsoleTab('result');
    setConsoleLogs([
      `⚡ Initializing interactive environment for ${selectedLang.toUpperCase()}...`,
      `📦 Parsing source code syntax...`,
      `⚙️ Executing standard check assertions...`
    ]);

    requestAnimationFrame(() => {
      try {
        const { results, logs } = executeSandbox(editorCode, selectedLang, langContent.testCases, langContent?.functionName);
        setTestResults(results);
        setConsoleLogs(logs);

        const passedAll = results.every(r => r.status === 'passed');
        if (passedAll) {
          setCompilerStatus('passed');
          setChallengePassed(true);
          playSoundEffect('success');
          toast.success("All test cases passed! Ready to submit! 🏆", { icon: '✨' });
        } else {
          setCompilerStatus('failed');
          setChallengePassed(false);
          playSoundEffect('error');
          toast.error("Some test cases failed. Keep refining your logic!");
        }
      } catch (err) {
        setChallengePassed(false);
        if (err.message.includes("Compilation Error")) {
          setCompilerStatus('compile_error');
        } else {
          setCompilerStatus('failed');
        }
        setConsoleLogs(prev => [...prev, `💥 Compiler Panic Error: ${err.message}`]);
        playSoundEffect('error');
        toast.error("Compilation / Execution Failed!");
      }
    });
  };

  // Checkpoint run — uses checkpoint test cases + function name
  const handleCheckpointRunCode = useCallback(() => {
    const cpContent = activeCheckpointContent;
    if (!cpContent) return;
    setChallengePassed(false);
    setCompilerStatus('running');
    setActiveConsoleTab('result');
    setConsoleLogs([
      '⚡ Compiling your code...',
      `📋 Running ${cpContent.testCases.length} test case(s)...`
    ]);
    setTimeout(() => {
      try {
        const { results, logs } = executeSandbox(editorCode, selectedLang, cpContent.testCases, cpContent.functionName);
        setTestResults(results);
        setConsoleLogs(logs);
        const passedAll = results.every(r => r.status === 'passed');
        if (passedAll) {
          setCompilerStatus('passed');
          setChallengePassed(true);
          setCheckpointCodePassed(true);
          playSoundEffect('success');
          toast.success('🎉 All test cases passed! You can now complete this checkpoint!');
        } else {
          setCompilerStatus('failed');
          setChallengePassed(false);
          setCheckpointCodePassed(false);
          playSoundEffect('error');
          toast.error('❌ Some tests failed. Check the hints and try again! 💪');
        }
      } catch (err) {
        setCompilerStatus('compile_error');
        if (err.message.includes('Maximum call stack size exceeded')) {
          setConsoleLogs(prev => [...prev, `💥 CODE GURU: Stack Overflow Detected! You missed a base case or your recursive call isn't reducing the problem size.`]);
          toast.error('Code Guru: Stack Overflow! Check your base case.');
        } else {
          setConsoleLogs(prev => [...prev, `💥 Compilation Error: ${err.message}`]);
          toast.error('Compilation Error — check your syntax!');
        }
        playSoundEffect('error');
      }
    }, 1000);
  }, [activeCheckpointContent, editorCode, selectedLang]);

  const handleGamificationUpdate = () => {
    let totalXP = parseInt(localStorage.getItem('dsa_total_xp') || '0', 10);
    let streak = parseInt(localStorage.getItem('dsa_streak') || '0', 10);
    let lastSolveDate = localStorage.getItem('dsa_last_solve_date') || '';

    const todayStr = new Date().toDateString();
    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

    if (lastSolveDate === yesterdayStr) {
      streak += 1;
    } else if (lastSolveDate !== todayStr) {
      streak = 1;
    }

    localStorage.setItem('dsa_streak', streak.toString());
    localStorage.setItem('dsa_last_solve_date', todayStr);

    const firstSolveKey = `dsa_first_solve_${id}_${activeDifficulty}`;
    const isFirstSolve = !localStorage.getItem(firstSolveKey);
    let xpEarned = 100;

    if (isFirstSolve) {
      xpEarned += 50;
      localStorage.setItem(firstSolveKey, 'true');
    }

    const prevXP = totalXP;
    totalXP += xpEarned;
    localStorage.setItem('dsa_total_xp', totalXP.toString());

    const oldRank = getRank(prevXP);
    const newRank = getRank(totalXP);
    const leveledUp = oldRank.title !== newRank.title;

    // Core Quotes Catalog from Blueprint
    const quotesFirstSolve = [
      "System output confirmed! You just successfully converted logic into code. The compiler nods in quiet respect.",
      "One small return statement for you, one giant leap for your software career. Welcome to the coder club!",
      "Variables declared, conditions met, and test cases conquered. The journey of a thousand algorithms begins with a single pass!"
    ];
    const quotesStreak = [
      "Three days in a row! Your brain is starting to compile logic faster than your local processor. Keep the streak active!",
      "5-Day Streak achieved! Like a well-optimized system, you are running at peak efficiency. Keep up the rhythm!",
      "Unstoppable! A full week of active coding. Your neural network is training beautifully on daily logic patterns."
    ];
    const quotesPerformance = [
      "Execution completed in record time! Your code runs with such lean simplicity, even the garbage collector is taking notes.",
      "A perfectly clean submission. Not a single redundant variable in sight. That's pure structural art!",
      "All test cases passed on the first run! Your logical foresight is starting to resemble an advanced static code analysis tool."
    ];

    let quote = "";
    if (streak === 3) {
      quote = quotesStreak[0];
    } else if (streak === 5) {
      quote = quotesStreak[1];
    } else if (streak >= 7 && streak % 7 === 0) {
      quote = quotesStreak[2];
    } else if (isFirstSolve) {
      quote = quotesFirstSolve[Math.floor(Math.random() * quotesFirstSolve.length)];
    } else {
      const allQuotes = [...quotesFirstSolve, ...quotesPerformance];
      quote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
    }

    setCelebrationData({
      xpEarned,
      streak,
      quote,
      rank: newRank,
      leveledUp,
      newlyEarnedBadges: topic?.badge ? [topic.badge] : []
    });
  };

  // Submits the code attempt, persisting to backend
  const handleSubmitCode = async () => {
    setChallengePassed(false); // CRITICAL BUG FIX: Reset on submit
    setCompilerStatus('running');
    setActiveConsoleTab('result');
    setConsoleLogs([
      `🚀 Initiating heavy-duty submission compiler suite...`,
      `📦 Packaging solution code files...`,
      `⚙️ Executing sandboxed test evaluation suite...`
    ]);

    setTimeout(async () => {
      try {
        const startTime = performance.now();
        const { results, logs } = executeSandbox(editorCode, selectedLang, langContent.testCases, langContent?.functionName);
        const endTime = performance.now();

        setTestResults(results);
        setConsoleLogs(logs);

        const passedAll = results.every(r => r.status === 'passed');
        const passedCount = results.filter(r => r.status === 'passed').length;
        const totalCount = results.length;
        const runtime = Math.round(endTime - startTime + Math.random() * 5 + 5);

        const status = passedAll ? 'Accepted' : 'Wrong Answer';

        if (passedAll) {
          setCompilerStatus('passed');
          setChallengePassed(true);
          playSoundEffect('success');
          triggerConfettiExplosion();
          toast.success("Submission Accepted! +100 Quest XP Unlocked! 🏆", { icon: '✨' });

          // Progressive Difficulty Unlock Mechanism
          localStorage.setItem(`dsa_completed_${id}_${activeDifficulty}`, 'true');
          const difficulties = ['beginner', 'easy', 'medium', 'challenge'];
          const currentIdx = difficulties.indexOf(activeDifficulty);
          if (currentIdx !== -1 && currentIdx < difficulties.length - 1) {
            const nextDiff = difficulties[currentIdx + 1];
            toast.success(`New rank unlocked: ${nextDiff.toUpperCase()}! 🚀`);
          }

          // Trigger local gamification updates & celebration modal
          handleGamificationUpdate();

          // Automatically complete the topic in the background if not already completed!
          const isAlreadyCompleted = activeDomainProgress.completedTopics?.some(t => t.topicId === id || t.topicId?._id === id);
          if (!isAlreadyCompleted) {
            try {
              const res = await api.post('/progress/complete-topic', {
                topicId: id,
                studyTimeMinutes: Number(studyTime),
                notes: notes || 'Code submitted successfully via editor.',
                difficultyFeedback: difficultyFeedback || 'easy',
                confidenceLevel: confidenceLevel || 5,
                revisionNeeded: false
              });
              if (res.data.success) {
                const { newlyEarnedBadges, newlyEarnedCertificate, topicBadge } = res.data.data;
                setCelebrationData(prev => {
                  if (!prev) return null;
                  const finalBadges = newlyEarnedBadges && newlyEarnedBadges.length > 0
                    ? [...newlyEarnedBadges, ...(topicBadge ? [topicBadge] : [])]
                    : (topicBadge ? [topicBadge] : (topic?.badge ? [topic.badge] : []));

                  const uniqueBadges = finalBadges.filter((b, idx, self) =>
                    self.findIndex(x => x.name === b.name || x._id === b._id) === idx
                  );

                  return {
                    ...prev,
                    newlyEarnedBadges: uniqueBadges,
                    newlyEarnedCertificate
                  };
                });
              }
            } catch (autoErr) {
              console.error('Failed to auto-complete topic:', autoErr);
            }
          }
        } else {
          setCompilerStatus('failed');
          setChallengePassed(false); // Strictly reset
          playSoundEffect('error');
          toast.error("Submission Failed: Wrong Answer");
        }

        // Save to Database Submission History
        await api.post('/progress/submit-code', {
          topicId: id,
          code: editorCode,
          language: selectedLang,
          status,
          passedCount,
          totalCount,
          runtime
        });

        // Pull latest updates from DB
        fetchSubmissions();
        await refreshUser();

      } catch (err) {
        setChallengePassed(false); // Strictly reset
        if (err.message.includes("Compilation Error")) {
          setCompilerStatus('compile_error');
        } else {
          setCompilerStatus('failed');
        }
        setConsoleLogs(prev => [...prev, `💥 Submission crashed: ${err.message}`]);
        playSoundEffect('error');
        toast.error("Submission crashed! Check your syntax.");
      }
    }, 1500);
  };

  // Submit topic complete manually
  const handleComplete = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/progress/complete-topic', {
        topicId: id,
        studyTimeMinutes: Number(studyTime),
        notes,
        difficultyFeedback,
        confidenceLevel,
        revisionNeeded
      });
      await refreshUser();
      toast.success('Expedition Completed successfully! +50 XP 🚀');
      triggerConfettiExplosion();

      const { newlyEarnedBadges, newlyEarnedCertificate, topicBadge } = res.data.data;
      const finalBadges = newlyEarnedBadges && newlyEarnedBadges.length > 0
        ? newlyEarnedBadges
        : (topicBadge ? [topicBadge] : (topic?.badge ? [topic.badge] : []));

      setCelebrationData({
        xpEarned: 50,
        streak: res.data.data.dailyStreak || 1,
        quote: "Fantastic work! You have completed the topic and claimed its completion badge.",
        rank: { badge: "Mastered", title: "Topic Complete", style: "text-emerald-500" },
        leveledUp: false,
        newlyEarnedBadges: finalBadges,
        newlyEarnedCertificate,
        navigateOnClose: '/roadmap'
      });
    } catch (err) {
      toast.error('Failed to log quest completion progress');
    } finally {
      setSubmitting(false);
    }
  };

  // Checkpoint complete + claim rewards (all checkpoints done)
  const handleCheckpointCompleteTopic = async () => {
    try {
      setSubmitting(true);
      await api.post('/progress/complete-topic', {
        topicId: id, studyTimeMinutes: 90,
        notes: `Completed all ${CHECKPOINTS.length} checkpoints for ${topic?.title || 'Start Coding'}!`,
        difficultyFeedback: 'easy', confidenceLevel: 5, revisionNeeded: false
      });
      await refreshUser();
      toast.success(`🚀 ${topic?.title || 'Start Coding'} Complete! +150 XP earned!`);
      navigate('/roadmap');
    } catch { toast.error('Failed to save. Try again.'); }
    finally { setSubmitting(false); }
  };

  // Setup Emmet-like snippets and HTML language features for Monaco
  const handleEditorWillMount = (monaco) => {
    // Ensure HTML language defaults are rich
    if (monaco.languages.html && monaco.languages.html.htmlDefaults) {
      monaco.languages.html.htmlDefaults.setOptions({
        suggest: { html5: true, angular1: false, ionic: false }
      });
    }

    // Register custom snippets provider for HTML
    monaco.languages.registerCompletionItemProvider('html', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions = [
          {
            label: '!',
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: 'HTML5 Boilerplate',
            insertText: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  $1
</body>
</html>`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          }
        ];

        const tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'p', 'span', 'main', 'section', 'header', 'footer', 'nav', 'ul', 'ol', 'li', 'a', 'img', 'button', 'input', 'style', 'script'];

        tags.forEach(tag => {
          suggestions.push({
            label: tag,
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: `HTML <${tag}> element`,
            insertText: tag === 'img' ? '<img src="$1" alt="$2" />' : tag === 'input' ? '<input type="${1:text}" />' : `<${tag}>$1</${tag}>`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          });
        });

        return { suggestions };
      }
    });
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([editorCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return {
    // routing + auth
    id, navigate,
    user, refreshUser,
    // domain/progress
    activeDomainSlug, activeDomainKey, activeDomainProgress,
    isCompleted, nextTopic, prevTopic, allTopics,
    // topic
    topic, loading,
    // learning flow
    learningStep, setLearningStep, advanceStep, isChallengeUnlocked,
    isVideoFinished, setIsVideoFinished,
    // language + course
    selectedLang, setSelectedLang, useStriverAdvanced, setUseStriverAdvanced,
    dsaCourse, currentLangName,
    // editor state
    editorCode, setEditorCode,
    editorTheme, setEditorTheme, toggleWorkspaceTheme,
    consoleLogs, setConsoleLogs,
    compilerStatus, setCompilerStatus,
    challengePassed, setChallengePassed,
    testResults, setTestResults,
    showConfetti, particles,
    // LC-style tabs
    leftTab, setLeftTab, activeConsoleTab, setActiveConsoleTab,
    submissions, selectedSubCode, setSelectedSubCode,
    celebrationData, setCelebrationData,
    // feedback
    difficultyFeedback, setDifficultyFeedback,
    confidenceLevel, setConfidenceLevel,
    revisionNeeded, setRevisionNeeded,
    studyTime, setStudyTime, notes, setNotes, submitting, setSubmitting,
    // difficulty ladder
    activeDifficulty, setActiveDifficulty, lessonAnswers, setLessonAnswers,
    lessonAssessment, lessonAssessmentComplete,
    // checkpoint module
    isCheckpointMode, CHECKPOINTS, CHECKPOINT_LABELS, CHECKPOINT_ICONS,
    activeCheckpoint, setActiveCheckpoint,
    checkpointVideoFinished, setCheckpointVideoFinished,
    checkpointCodePassed, setCheckpointCodePassed,
    completedCheckpoints, markCheckpointComplete,
    currentCpIndex, isLastCp,
    // domain flags
    isDsaDomain, isWebDevDomain, shouldSplitWorkspace, availableLanguages,
    // content
    langContent, activeCheckpointContent, checkpointVideoEmbedUrl, activeVideoEmbedUrl,
    // layout
    isCpSidebarOpen, setIsCpSidebarOpen,
    activeWorkspaceTab, setActiveWorkspaceTab,
    isMobile, isSidebarOpen, setIsSidebarOpen,
    leftWidth, setLeftWidth, isDragging, startResize, isFullscreen, setIsFullscreen,
    // actions
    handleRunCode, handleCheckpointRunCode, handleSubmitCode, handleComplete,
    handleCheckpointCompleteTopic,
    handleGamificationUpdate, handleLoadSubmission,
    handleEditorWillMount, handleOpenInNewTab,
    triggerConfettiExplosion, fetchSubmissions, fetchTopic
  };
};