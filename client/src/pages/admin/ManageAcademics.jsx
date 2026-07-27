import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiPlus, FiEdit, FiTrash2, FiVideo, FiFolder, FiGrid, FiLayers, FiList } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';

const ManageAcademics = () => {
  const navigate = useNavigate();
  
  // Data lists
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [videos, setVideos] = useState([]);

  // Active Selections for Navigation/Filtering
  const [selectedSem, setSelectedSem] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Loading States
  const [loading, setLoading] = useState(true);

  // Modal Forms
  const [modalType, setModalType] = useState(null); // 'sem' | 'branch' | 'subj' | 'chap' | 'video' | null
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [activeItem, setActiveItem] = useState(null); // Item being edited

  // Form Fields
  const [semForm, setSemForm] = useState({ number: 1, name: '', isActive: true, order: 0 });
  const [branchForm, setBranchForm] = useState({ name: '', code: '', isActive: false, order: 0 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', icon: '🎓', description: '', isActive: true, order: 0 });
  const [chapterForm, setChapterForm] = useState({ chapterNumber: 1, name: '', description: '', isActive: true, order: 0 });
  const [videoForm, setVideoForm] = useState({ 
    title: '', 
    description: '', 
    videoType: 'drive', 
    driveLink: '', 
    thumbnail: '', 
    duration: 600, 
    notesUrl: '', 
    order: 0, 
    isPublished: true, 
    chapterId: '' 
  });

  useEffect(() => {
    fetchBaseData();
  }, []);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const [semRes, branchRes] = await Promise.all([
        api.get('/academics/semesters'),
        api.get('/academics/branches')
      ]);
      setSemesters(semRes.data.data || []);
      setBranches(branchRes.data.data || []);

      if (semRes.data.data?.length > 0) setSelectedSem(semRes.data.data[0]);
      if (branchRes.data.data?.length > 0) setSelectedBranch(branchRes.data.data[0]);
    } catch (e) {
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects when semester or branch selection changes
  useEffect(() => {
    if (selectedSem && selectedBranch) {
      fetchSubjects();
    }
  }, [selectedSem, selectedBranch]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/academics/subjects?semesterId=${selectedSem._id}&branchId=${selectedBranch._id}`);
      setSubjects(res.data.data || []);
      setSelectedSubject(null);
      setChapters([]);
      setSelectedChapter(null);
      setVideos([]);
    } catch (e) {
      toast.error('Failed to load subjects');
    }
  };

  // Fetch chapters when subject selection changes
  useEffect(() => {
    if (selectedSubject) {
      fetchChapters();
    }
  }, [selectedSubject]);

  const fetchChapters = async () => {
    try {
      const res = await api.get(`/academics/chapters?subjectId=${selectedSubject._id}`);
      setChapters(res.data.data || []);
      setSelectedChapter(null);
      setVideos([]);
    } catch (e) {
      toast.error('Failed to load chapters');
    }
  };

  // Fetch videos when chapter selection changes
  useEffect(() => {
    if (selectedChapter) {
      fetchVideos();
    }
  }, [selectedChapter]);

  const fetchVideos = async () => {
    try {
      const res = await api.get(`/academics/videos?chapterId=${selectedChapter._id}`);
      setVideos((res.data.data || []).sort((a, b) => a.order - b.order));
    } catch (e) {
      toast.error('Failed to load videos');
    }
  };

  // Helper: Open Modal
  const openModal = (type, mode, item = null) => {
    setModalType(type);
    setModalMode(mode);
    setActiveItem(item);

    if (type === 'sem') {
      setSemForm(item ? { ...item } : { number: semesters.length + 1, name: '', isActive: true, order: semesters.length + 1 });
    } else if (type === 'branch') {
      setBranchForm(item ? { ...item } : { name: '', code: '', isActive: false, order: branches.length + 1 });
    } else if (type === 'subj') {
      setSubjectForm(item ? { ...item } : { name: '', code: '', icon: '🎓', description: '', isActive: true, order: subjects.length + 1 });
    } else if (type === 'chap') {
      setChapterForm(item ? { ...item } : { chapterNumber: chapters.length + 1, name: '', description: '', isActive: true, order: chapters.length + 1 });
    } else if (type === 'video') {
      setVideoForm(item ? { 
        title: item.title,
        description: item.description || '',
        videoType: item.videoType || 'drive',
        driveLink: item.driveLink || '',
        thumbnail: item.thumbnail || '',
        duration: item.duration || 600,
        notesUrl: item.notesUrl || '',
        order: item.order || videos.length + 1,
        isPublished: item.isPublished !== undefined ? item.isPublished : true,
        chapterId: item.chapterId?._id || item.chapterId || selectedChapter._id
      } : { 
        title: '', 
        description: '', 
        videoType: 'drive', 
        driveLink: '', 
        thumbnail: '', 
        duration: 600, 
        notesUrl: '', 
        order: videos.length + 1, 
        isPublished: true,
        chapterId: selectedChapter._id
      });
    }
  };

  // Helper: Close Modal
  const closeModal = () => {
    setModalType(null);
    setActiveItem(null);
  };

  // Form Submit Handlers
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      let method = modalMode === 'create' ? 'post' : 'put';
      let payload = {};

      if (modalType === 'sem') {
        endpoint = modalMode === 'create' ? '/admin/academics/semester' : `/admin/academics/semester/${activeItem._id}`;
        payload = semForm;
      } else if (modalType === 'branch') {
        endpoint = modalMode === 'create' ? '/admin/academics/branch' : `/admin/academics/branch/${activeItem._id}`;
        payload = branchForm;
      } else if (modalType === 'subj') {
        endpoint = modalMode === 'create' ? '/admin/academics/subject' : `/admin/academics/subject/${activeItem._id}`;
        payload = { ...subjectForm, semesterId: selectedSem._id, branchId: selectedBranch._id };
      } else if (modalType === 'chap') {
        endpoint = modalMode === 'create' ? '/admin/academics/chapter' : `/admin/academics/chapter/${activeItem._id}`;
        payload = { ...chapterForm, subjectId: selectedSubject._id };
      } else if (modalType === 'video') {
        endpoint = modalMode === 'create' ? '/admin/academics/video' : `/admin/academics/video/${activeItem._id}`;
        payload = { ...videoForm };
      }

      await api[method](endpoint, payload);
      toast.success(`${modalType.toUpperCase()} ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
      
      closeModal();
      
      // Refresh active context lists
      if (modalType === 'sem') fetchBaseData();
      else if (modalType === 'branch') fetchBaseData();
      else if (modalType === 'subj') fetchSubjects();
      else if (modalType === 'chap') fetchChapters();
      else if (modalType === 'video') {
        // If chapter assignment was changed, refresh subject's chapters and clear current selections
        fetchVideos();
        fetchChapters();
      }

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit form');
    }
  };

  // Delete Handlers
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const endpoint = `/admin/academics/${type}/${id}`;
      await api.delete(endpoint);
      toast.success(`${type.toUpperCase()} deleted successfully!`);
      
      if (type === 'semester') fetchBaseData();
      else if (type === 'branch') fetchBaseData();
      else if (type === 'subject') fetchSubjects();
      else if (type === 'chapter') fetchChapters();
      else if (type === 'video') fetchVideos();
    } catch (err) {
      toast.error('Failed to delete item');
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
    <div className="max-w-7xl mx-auto py-10 px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-xs uppercase tracking-wider mb-4 transition-colors outline-none cursor-pointer"
          >
            <FiChevronLeft size={16} strokeWidth={3} /> Back to Admin
          </button>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-3">
            <FaGraduationCap className="text-[var(--primary)]" /> B.Tech Academics Management
          </h1>
        </div>
      </div>

      {/* Main Grid: Split Layout */}
      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav: Semesters & Branches selection */}
        <div className="space-y-6 lg:col-span-1">
          {/* Semester Selector */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5"><FiLayers /> Semesters</h3>
              <button onClick={() => openModal('sem', 'create')} className="w-6 h-6 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-xs font-black"><FiPlus /></button>
            </div>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
              {semesters.map(sem => (
                <div 
                  key={sem._id}
                  onClick={() => setSelectedSem(sem)}
                  className={`flex justify-between items-center px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${selectedSem?._id === sem._id ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-main)] hover:bg-[var(--bg-sub)]/30 border border-transparent hover:border-[var(--border)]'}`}
                >
                  <span>{sem.name}</span>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openModal('sem', 'edit', sem); }} className="hover:text-amber-400 p-0.5"><FiEdit size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete('semester', sem._id); }} className="hover:text-red-400 p-0.5"><FiTrash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branch Selector */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5"><FiGrid /> Branches</h3>
              <button onClick={() => openModal('branch', 'create')} className="w-6 h-6 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-xs font-black"><FiPlus /></button>
            </div>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
              {branches.map(br => (
                <div 
                  key={br._id}
                  onClick={() => setSelectedBranch(br)}
                  className={`flex justify-between items-center px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${selectedBranch?._id === br._id ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-main)] hover:bg-[var(--bg-sub)]/30 border border-transparent hover:border-[var(--border)]'}`}
                >
                  <span className="truncate">{br.code} {br.isActive ? '🟢' : '🔴'}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); openModal('branch', 'edit', br); }} className="hover:text-amber-400 p-0.5"><FiEdit size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete('branch', br._id); }} className="hover:text-red-400 p-0.5"><FiTrash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Pane: Subjects -> Chapters -> Videos */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Subjects Block */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest bg-[var(--primary-light)] px-2.5 py-1 rounded-lg border border-green-200">
                  {selectedSem?.name} • {selectedBranch?.code}
                </span>
                <h3 className="text-lg font-black text-[var(--text-main)] mt-2">Subjects</h3>
              </div>
              <button 
                onClick={() => openModal('subj', 'create')}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
              >
                <FiPlus /> Add Subject
              </button>
            </div>

            {subjects.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-xl text-[var(--text-light)] font-bold text-sm">
                No subjects configured. Add one to start.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {subjects.map(subj => (
                  <div 
                    key={subj._id}
                    onClick={() => setSelectedSubject(subj)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedSubject?._id === subj._id ? 'border-[var(--primary)] bg-[var(--primary-light)]/20' : 'border-[var(--border-light)] hover:border-[var(--border)]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{subj.icon || '🎓'}</span>
                      <div>
                        <h4 className="font-black text-sm text-[var(--text-main)]">{subj.name}</h4>
                        <span className="text-[10px] font-bold text-[var(--text-light)] uppercase tracking-wider">{subj.code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openModal('subj', 'edit', subj); }} className="hover:text-amber-500 p-1 bg-[var(--bg-sub)] rounded"><FiEdit size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete('subject', subj._id); }} className="hover:text-red-500 p-1 bg-[var(--bg-sub)] rounded"><FiTrash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chapters Block */}
          {selectedSubject && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[10px] font-black text-[var(--text-light)] uppercase tracking-widest">Active Subject: {selectedSubject.name}</span>
                  <h3 className="text-lg font-black text-[var(--text-main)] mt-1 flex items-center gap-1.5"><FiFolder /> Chapters</h3>
                </div>
                <button 
                  onClick={() => openModal('chap', 'create')}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <FiPlus /> Add Chapter
                </button>
              </div>

              {chapters.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-xl text-[var(--text-light)] font-bold text-sm">
                  No chapters configured for this subject.
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map(chap => (
                    <div 
                      key={chap._id}
                      onClick={() => setSelectedChapter(chap)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedChapter?._id === chap._id ? 'border-[var(--primary)] bg-[var(--primary-light)]/20' : 'border-[var(--border-light)] hover:border-[var(--border)]'}`}
                    >
                      <div>
                        <h4 className="font-black text-sm text-[var(--text-main)]">Chapter {chap.chapterNumber}: {chap.name}</h4>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-1 font-semibold">{chap.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openModal('chap', 'edit', chap); }} className="hover:text-amber-500 p-1 bg-[var(--bg-sub)] rounded"><FiEdit size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete('chapter', chap._id); }} className="hover:text-red-500 p-1 bg-[var(--bg-sub)] rounded"><FiTrash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video Lectures Block */}
          {selectedChapter && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[10px] font-black text-[var(--text-light)]">Active Chapter: {selectedChapter.name}</span>
                  <h3 className="text-lg font-black text-[var(--text-main)] mt-1 flex items-center gap-1.5"><FiVideo /> Video Lectures</h3>
                </div>
                <button 
                  onClick={() => openModal('video', 'create')}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <FiPlus /> Add Video
                </button>
              </div>

              {videos.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-xl text-[var(--text-light)] font-bold text-sm">
                  No videos assigned to this chapter yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {videos.map(vid => (
                    <div 
                      key={vid._id}
                      className="p-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-sub)]/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-150 text-green-700 flex items-center justify-center font-bold text-lg">🎬</div>
                        <div>
                          <h4 className="font-black text-sm text-[var(--text-main)]">{vid.title}</h4>
                          <span className="text-[9px] font-bold text-[var(--text-light)] uppercase tracking-wider block mt-0.5">
                            Duration: {Math.floor((vid.duration || 600) / 60)}m • {vid.videoType || 'drive'} • Order: {vid.order} • {vid.isPublished ? '🟢 Published' : '🔴 Draft'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal('video', 'edit', vid)} className="hover:text-amber-500 p-1 bg-[var(--bg-sub)] rounded"><FiEdit size={14} /></button>
                        <button onClick={() => handleDelete('video', vid._id)} className="hover:text-red-500 p-1 bg-[var(--bg-sub)] rounded"><FiTrash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* CRUD MODAL FORMS */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">
                {modalMode === 'create' ? 'Create' : 'Edit'} {modalType.toUpperCase()}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Semester Form Fields */}
                {modalType === 'sem' && (
                  <>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Semester Number</label>
                      <input type="number" required value={semForm.number} onChange={e => setSemForm({...semForm, number: parseInt(e.target.value) || 0})} className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Display Name</label>
                      <input type="text" required value={semForm.name} onChange={e => setSemForm({...semForm, name: e.target.value})} placeholder="e.g. Semester 1" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Order</label>
                      <input type="number" value={semForm.order} onChange={e => setSemForm({...semForm, order: parseInt(e.target.value) || 0})} className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                  </>
                )}

                {/* Branch Form Fields */}
                {modalType === 'branch' && (
                  <>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Branch Code</label>
                      <input type="text" required value={branchForm.code} onChange={e => setBranchForm({...branchForm, code: e.target.value})} placeholder="e.g. CSE" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Full Branch Name</label>
                      <input type="text" required value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} placeholder="e.g. Computer Science Engineering" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input type="checkbox" id="branchActive" checked={branchForm.isActive} onChange={e => setBranchForm({...branchForm, isActive: e.target.checked})} className="w-4 h-4 rounded" />
                      <label htmlFor="branchActive" className="text-xs font-black text-[var(--text-main)] uppercase cursor-pointer">Active (Syllabus content visible)</label>
                    </div>
                  </>
                )}

                {/* Subject Form Fields */}
                {modalType === 'subj' && (
                  <>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Subject Code</label>
                      <input type="text" required value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} placeholder="e.g. ADA" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Subject Name</label>
                      <input type="text" required value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} placeholder="e.g. Design & Analysis of Algorithms" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Icon Emoji</label>
                      <input type="text" value={subjectForm.icon} onChange={e => setSubjectForm({...subjectForm, icon: e.target.value})} placeholder="e.g. 🎓" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Description</label>
                      <textarea value={subjectForm.description} onChange={e => setSubjectForm({...subjectForm, description: e.target.value})} placeholder="Subject syllabus description..." className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm h-20" />
                    </div>
                  </>
                )}

                {/* Chapter Form Fields */}
                {modalType === 'chap' && (
                  <>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Chapter Number</label>
                      <input type="number" required value={chapterForm.chapterNumber} onChange={e => setChapterForm({...chapterForm, chapterNumber: parseInt(e.target.value) || 0})} className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Chapter Title</label>
                      <input type="text" required value={chapterForm.name} onChange={e => setChapterForm({...chapterForm, name: e.target.value})} placeholder="e.g. Introduction to Algorithms" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Description</label>
                      <textarea value={chapterForm.description} onChange={e => setChapterForm({...chapterForm, description: e.target.value})} placeholder="Chapter description..." className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm h-20" />
                    </div>
                  </>
                )}

                {/* Video Form Fields */}
                {modalType === 'video' && (
                  <>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Video Title</label>
                      <input type="text" required value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} placeholder="e.g. Lecture 1: Big O Notation" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Description</label>
                      <textarea value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} placeholder="Video description..." className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm h-16" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Video Provider</label>
                        <select value={videoForm.videoType} onChange={e => setVideoForm({...videoForm, videoType: e.target.value})} className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm font-bold">
                          <option value="drive">Google Drive</option>
                          <option value="youtube">YouTube Unlisted</option>
                          <option value="s3">AWS S3</option>
                          <option value="cloudinary">Cloudinary</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Chapter Assignment</label>
                        <select value={videoForm.chapterId} onChange={e => setVideoForm({...videoForm, chapterId: e.target.value})} className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm font-bold">
                          {chapters.map(c => (
                            <option key={c._id} value={c._id}>Chapter {c.chapterNumber}: {c.name.substring(0, 20)}...</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Google Drive Link / Video URL</label>
                      <input type="text" required value={videoForm.driveLink} onChange={e => setVideoForm({...videoForm, driveLink: e.target.value})} placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Thumbnail URL</label>
                      <input type="text" value={videoForm.thumbnail} onChange={e => setVideoForm({...videoForm, thumbnail: e.target.value})} placeholder="https://image-link.com/thumbnail.png" className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Duration (seconds)</label>
                        <input type="number" required value={videoForm.duration} onChange={e => setVideoForm({...videoForm, duration: parseInt(e.target.value) || 0})} className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Display Order</label>
                        <input type="number" required value={videoForm.order} onChange={e => setVideoForm({...videoForm, order: parseInt(e.target.value) || 0})} className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider block mb-1">Notes URL (optional)</label>
                      <input type="text" value={videoForm.notesUrl} onChange={e => setVideoForm({...videoForm, notesUrl: e.target.value})} placeholder="Link to PDF notes..." className="w-full bg-[var(--bg-sub)] border border-[var(--border)] p-3 rounded-xl text-sm" />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input type="checkbox" id="isPublished" checked={videoForm.isPublished} onChange={e => setVideoForm({...videoForm, isPublished: e.target.checked})} className="w-4 h-4 rounded accent-[var(--primary)]" />
                      <label htmlFor="isPublished" className="text-xs font-black text-[var(--text-main)] uppercase select-none cursor-pointer">Published (Visible to students)</label>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-[var(--primary)] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[var(--primary-hover)] transition-all cursor-pointer shadow-md">Submit</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ManageAcademics;
