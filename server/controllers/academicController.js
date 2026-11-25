const AcademicSemester = require('../models/AcademicSemester');
const AcademicBranch = require('../models/AcademicBranch');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicChapter = require('../models/AcademicChapter');
const AcademicVideo = require('../models/AcademicVideo');
const AcademicProgress = require('../models/AcademicProgress');

const isCurriculumId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const readProgress = (user, subjectId) => user ? AcademicProgress.findOne({ userId: user._id, subjectId }) : null;
const visibleVideos = (req) => ({ isActive: true, ...(req.user ? {} : { isPublished: true }) });

// ==========================================
// STUDENT ENDPOINTS
// ==========================================

// @desc    Get all semesters
// @route   GET /api/academics/semesters
exports.getSemesters = async (req, res) => {
  try {
    const semesters = await AcademicSemester.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all branches
// @route   GET /api/academics/branches
exports.getBranches = async (req, res) => {
  try {
    const branches = await AcademicBranch.find({}).sort({ order: 1 });
    res.json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subjects for a semester and branch with user progress
// @route   GET /api/academics/subjects
exports.getSubjects = async (req, res) => {
  try {
    const { semesterId, branchId } = req.query;
    if (!isCurriculumId(semesterId) || !isCurriculumId(branchId)) {
      return res.status(400).json({ success: false, message: 'Please provide semesterId and branchId' });
    }

    const subjects = await AcademicSubject.find({ semesterId, branchId, isActive: true }).sort({ order: 1 });
    
    const subjectIds = subjects.map((subject) => subject._id);
    const [chapterCounts, progressRows] = subjectIds.length ? await Promise.all([
      AcademicChapter.aggregate([
        { $match: { subjectId: { $in: subjectIds }, isActive: true } },
        { $group: { _id: '$subjectId', total: { $sum: 1 } } },
      ]),
      req.user ? AcademicProgress.find({ userId: req.user._id, subjectId: { $in: subjectIds } })
        .select('subjectId completedChapters completedVideos lastOpenedChapterId lastOpenedVideoId').lean() : [],
    ]) : [[], []];
    const counts = new Map(chapterCounts.map(({ _id, total }) => [String(_id), total]));
    const progressBySubject = new Map(progressRows.map((item) => [String(item.subjectId), item]));
    const subjectsWithProgress = subjects.map((subject) => {
      const key = String(subject._id);
      const progress = progressBySubject.get(key);
      return {
        ...subject.toObject(),
        totalChapters: counts.get(key) || 0,
        completedChaptersCount: progress?.completedChapters?.length || 0,
        completedVideosCount: progress?.completedVideos?.length || 0,
        lastOpenedChapterId: progress?.lastOpenedChapterId || null,
        lastOpenedVideoId: progress?.lastOpenedVideoId || null,
      };
    });

    res.json({ success: true, data: subjectsWithProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chapters of a subject with completion & lock status
// @route   GET /api/academics/chapters
exports.getChapters = async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!isCurriculumId(subjectId)) {
      return res.status(400).json({ success: false, message: 'Please provide subjectId' });
    }

    const [subject, chapters, progress] = await Promise.all([
      AcademicSubject.findById(subjectId),
      AcademicChapter.find({ subjectId, isActive: true }).sort({ chapterNumber: 1 }),
      readProgress(req.user, subjectId),
    ]);
    if (!subject || (!req.user && !subject.isActive)) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    const completedChapters = progress ? progress.completedChapters.map(id => id.toString()) : [];

    const visible = req.user
      ? { $eq: ['$isActive', true] }
      : { $and: [{ $eq: ['$isActive', true] }, { $eq: ['$isPublished', true] }] };
    const videoCounts = chapters.length ? await AcademicVideo.aggregate([
      { $match: { chapterId: { $in: chapters.map((chapter) => chapter._id) } } },
      { $group: {
        _id: '$chapterId',
        total: { $sum: { $cond: [visible, 1, 0] } },
        completed: { $sum: { $cond: [{ $in: ['$_id', progress?.completedVideos || []] }, 1, 0] } },
      } },
    ]) : [];
    const byChapter = new Map(videoCounts.map((item) => [String(item._id), item]));
    const chaptersWithStatus = chapters.map((chapter, index) => {
      const counts = byChapter.get(String(chapter._id));
      return {
        ...chapter.toObject(),
        videosCount: counts?.total || 0,
        completedVideosCount: counts?.completed || 0,
        completedStatus: completedChapters.includes(String(chapter._id)),
        isLocked: Boolean(req.user && index > 0 && !completedChapters.includes(String(chapters[index - 1]._id))),
      };
    });

    res.json({ success: true, data: chaptersWithStatus, subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get videos of a chapter with user watch progress
// @route   GET /api/academics/videos
exports.getVideos = async (req, res) => {
  try {
    const { chapterId } = req.query;
    if (!isCurriculumId(chapterId)) {
      return res.status(400).json({ success: false, message: 'Please provide chapterId' });
    }

    const chapter = await AcademicChapter.findById(chapterId);
    const subject = chapter && await AcademicSubject.findById(chapter.subjectId);
    if (!chapter || !subject || (!req.user && (!chapter.isActive || !subject.isActive))) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }

    const videos = await AcademicVideo.find({ chapterId, ...visibleVideos(req) }).sort({ order: 1 });
    const progress = await readProgress(req.user, chapter.subjectId);

    const videosWithProgress = videos.map((vid) => {
      const history = progress?.watchHistory?.find(h => h.videoId.toString() === vid._id.toString());
      const isCompleted = progress?.completedVideos?.some(id => id.toString() === vid._id.toString()) || false;
      return {
        ...vid.toObject(),
        completed: isCompleted,
        watchPercentage: history ? history.watchPercentage : 0,
        timestamp: history ? history.timestamp : 0
      };
    });

    res.json({ success: true, data: videosWithProgress, chapter, subject, lastOpenedVideoId: progress?.lastOpenedVideoId || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user progress for a subject
// @route   GET /api/academics/progress
exports.getProgress = async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'Please provide subjectId' });
    }

    let progress = await AcademicProgress.findOne({ userId: req.user._id, subjectId });
    if (!progress) {
      progress = await AcademicProgress.create({
        userId: req.user._id,
        subjectId,
        completedVideos: [],
        completedChapters: [],
        watchHistory: []
      });
    }

    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update watch and completion progress for a video
// @route   POST /api/academics/progress
exports.updateProgress = async (req, res) => {
  try {
    const { subjectId, chapterId, videoId, timestamp, watchPercentage, timeSpentDelta, completed } = req.body;
    if (!subjectId || !chapterId || !videoId) {
      return res.status(400).json({ success: false, message: 'Please provide subjectId, chapterId, and videoId' });
    }

    let progress = await AcademicProgress.findOne({ userId: req.user._id, subjectId });
    if (!progress) {
      progress = new AcademicProgress({
        userId: req.user._id,
        subjectId,
        completedVideos: [],
        completedChapters: [],
        watchHistory: []
      });
    }

    // Update active learning state
    progress.lastOpenedChapterId = chapterId;
    progress.lastOpenedVideoId = videoId;

    // Manage watch history
    let historyItem = progress.watchHistory.find(h => h.videoId.toString() === videoId);
    if (historyItem) {
      historyItem.timestamp = timestamp !== undefined ? timestamp : historyItem.timestamp;
      historyItem.watchPercentage = watchPercentage !== undefined ? Math.max(historyItem.watchPercentage, watchPercentage) : historyItem.watchPercentage;
      historyItem.timeSpent += timeSpentDelta || 0;
      historyItem.lastWatchedAt = Date.now();
      if (completed) historyItem.completed = true;
    } else {
      progress.watchHistory.push({
        videoId,
        timestamp: timestamp || 0,
        watchPercentage: watchPercentage || 0,
        timeSpent: timeSpentDelta || 0,
        completed: completed || false,
        lastWatchedAt: Date.now()
      });
    }

    // Add to completed videos if completed
    if (completed && !progress.completedVideos.includes(videoId)) {
      progress.completedVideos.push(videoId);
    }

    // Check if chapter is completed (all active videos in this chapter are completed)
    let chapterCompleted = false;
    if (completed) {
      const chapterVideos = await AcademicVideo.find({ chapterId, isActive: true });
      const chapterVideoIds = chapterVideos.map(v => v._id.toString());
      
      const userCompletedVideoIds = progress.completedVideos.map(id => id.toString());
      const allDone = chapterVideoIds.every(id => userCompletedVideoIds.includes(id));
      
      if (allDone && !progress.completedChapters.includes(chapterId)) {
        progress.completedChapters.push(chapterId);
        chapterCompleted = true;
      }
    }

    await progress.save();

    res.json({
      success: true,
      data: progress,
      chapterCompleted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// ADMIN ENDPOINTS (CRUD OPERATIONS)
// ==========================================

// --- SEMESTERS ---
exports.createSemester = async (req, res) => {
  try {
    const sem = await AcademicSemester.create(req.body);
    res.status(201).json({ success: true, data: sem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateSemester = async (req, res) => {
  try {
    const sem = await AcademicSemester.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sem) return res.status(404).json({ success: false, message: 'Semester not found' });
    res.json({ success: true, data: sem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSemester = async (req, res) => {
  try {
    const sem = await AcademicSemester.findByIdAndDelete(req.params.id);
    if (!sem) return res.status(404).json({ success: false, message: 'Semester not found' });
    res.json({ success: true, message: 'Semester deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- BRANCHES ---
exports.createBranch = async (req, res) => {
  try {
    const branch = await AcademicBranch.create(req.body);
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const branch = await AcademicBranch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch = await AcademicBranch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SUBJECTS ---
exports.createSubject = async (req, res) => {
  try {
    const subj = await AcademicSubject.create(req.body);
    res.status(201).json({ success: true, data: subj });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const subj = await AcademicSubject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subj) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subj });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subj = await AcademicSubject.findByIdAndDelete(req.params.id);
    if (!subj) return res.status(404).json({ success: false, message: 'Subject not found' });
    // Cleanup chapters & videos belonging to this subject
    const chapters = await AcademicChapter.find({ subjectId: req.params.id });
    const chapterIds = chapters.map(c => c._id);
    await AcademicVideo.deleteMany({ chapterId: { $in: chapterIds } });
    await AcademicChapter.deleteMany({ subjectId: req.params.id });
    
    res.json({ success: true, message: 'Subject and its chapters/videos deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- CHAPTERS ---
exports.createChapter = async (req, res) => {
  try {
    const chapter = await AcademicChapter.create(req.body);
    res.status(201).json({ success: true, data: chapter });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateChapter = async (req, res) => {
  try {
    const chapter = await AcademicChapter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    res.json({ success: true, data: chapter });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await AcademicChapter.findByIdAndDelete(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    // Cleanup videos under this chapter
    await AcademicVideo.deleteMany({ chapterId: req.params.id });
    res.json({ success: true, message: 'Chapter and its videos deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Parse Google Drive link and generate preview URL
const parseDriveLink = (link) => {
  if (!link) return { id: '', previewUrl: '' };
  
  // Format: /file/d/FILE_ID/view or /file/d/FILE_ID/preview
  let match = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return {
      id: match[1],
      previewUrl: `https://drive.google.com/file/d/${match[1]}/preview`
    };
  }

  // Format: /open?id=FILE_ID
  match = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return {
      id: match[1],
      previewUrl: `https://drive.google.com/file/d/${match[1]}/preview`
    };
  }

  // Generic fallback: /d/FILE_ID
  match = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return {
      id: match[1],
      previewUrl: `https://drive.google.com/file/d/${match[1]}/preview`
    };
  }

  // If already a preview URL or cannot be parsed, use it directly
  return { id: '', previewUrl: link };
};

// Helper: Populate subject, semester, and branch from chapter
const resolveAcademicsHierarchy = async (payload) => {
  if (payload.chapterId) {
    const chapter = await AcademicChapter.findById(payload.chapterId);
    if (chapter) {
      payload.subjectId = chapter.subjectId;
      const subject = await AcademicSubject.findById(chapter.subjectId);
      if (subject) {
        payload.semesterId = subject.semesterId;
        payload.branchId = subject.branchId;
      }
    }
  }
};

// --- VIDEOS ---
exports.createVideo = async (req, res) => {
  try {
    const payload = { ...req.body };
    await resolveAcademicsHierarchy(payload);

    if (payload.videoType === 'drive' && payload.driveLink) {
      const parsed = parseDriveLink(payload.driveLink);
      payload.embedLink = parsed.previewUrl;
    } else {
      payload.embedLink = payload.driveLink; // Fallback
    }

    const video = await AcademicVideo.create(payload);
    res.status(201).json({ success: true, data: video });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const payload = { ...req.body };
    await resolveAcademicsHierarchy(payload);

    if (payload.videoType === 'drive' && payload.driveLink) {
      const parsed = parseDriveLink(payload.driveLink);
      payload.embedLink = parsed.previewUrl;
    } else if (payload.driveLink) {
      payload.embedLink = payload.driveLink;
    }

    const video = await AcademicVideo.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const video = await AcademicVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
