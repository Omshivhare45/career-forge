const AcademicSemester = require('../models/AcademicSemester');
const AcademicBranch = require('../models/AcademicBranch');
const AcademicSubject = require('../models/AcademicSubject');
const AcademicChapter = require('../models/AcademicChapter');
const AcademicVideo = require('../models/AcademicVideo');
const AcademicProgress = require('../models/AcademicProgress');

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
    if (!semesterId || !branchId) {
      return res.status(400).json({ success: false, message: 'Please provide semesterId and branchId' });
    }

    const subjects = await AcademicSubject.find({ semesterId, branchId, isActive: true }).sort({ order: 1 });
    
    // Fetch user progress for each subject
    const subjectsWithProgress = await Promise.all(
      subjects.map(async (subj) => {
        const totalChapters = await AcademicChapter.countDocuments({ subjectId: subj._id, isActive: true });
        
        const progress = await AcademicProgress.findOne({ userId: req.user._id, subjectId: subj._id });
        
        return {
          ...subj.toObject(),
          totalChapters,
          completedChaptersCount: progress ? progress.completedChapters.length : 0,
          completedVideosCount: progress ? progress.completedVideos.length : 0,
          lastOpenedChapterId: progress ? progress.lastOpenedChapterId : null,
          lastOpenedVideoId: progress ? progress.lastOpenedVideoId : null
        };
      })
    );

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
    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'Please provide subjectId' });
    }

    const chapters = await AcademicChapter.find({ subjectId, isActive: true }).sort({ chapterNumber: 1 });
    const progress = await AcademicProgress.findOne({ userId: req.user._id, subjectId });
    const completedChapters = progress ? progress.completedChapters.map(id => id.toString()) : [];

    const chaptersWithStatus = await Promise.all(
      chapters.map(async (ch, index) => {
        const videosCount = await AcademicVideo.countDocuments({ chapterId: ch._id, isActive: true });
        
        // Chapter 1 (index 0) is always unlocked. Others unlock if previous chapter is completed
        let isLocked = false;
        if (index > 0) {
          const prevChapterId = chapters[index - 1]._id.toString();
          isLocked = !completedChapters.includes(prevChapterId);
        }

        const completedVideosCount = progress
          ? await AcademicVideo.countDocuments({
              chapterId: ch._id,
              _id: { $in: progress.completedVideos }
            })
          : 0;

        return {
          ...ch.toObject(),
          videosCount,
          completedVideosCount,
          completedStatus: completedChapters.includes(ch._id.toString()),
          isLocked
        };
      })
    );

    res.json({ success: true, data: chaptersWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get videos of a chapter with user watch progress
// @route   GET /api/academics/videos
exports.getVideos = async (req, res) => {
  try {
    const { chapterId } = req.query;
    if (!chapterId) {
      return res.status(400).json({ success: false, message: 'Please provide chapterId' });
    }

    const chapter = await AcademicChapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }

    const videos = await AcademicVideo.find({ chapterId, isActive: true }).sort({ order: 1 });
    const progress = await AcademicProgress.findOne({ userId: req.user._id, subjectId: chapter.subjectId });

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

    res.json({ success: true, data: videosWithProgress });
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

// --- VIDEOS ---
exports.createVideo = async (req, res) => {
  try {
    const video = await AcademicVideo.create(req.body);
    res.status(201).json({ success: true, data: video });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const video = await AcademicVideo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
