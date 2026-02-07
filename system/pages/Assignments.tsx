import React, { useState, useEffect, useRef } from 'react';
import { User, Assignment, Submission, UserRole } from '../types';
import { api } from '../src/api'; 
import { Clock, CheckCircle2, FileUp, Loader2, UploadCloud, FileText, CheckCircle, Search, Info, PlusCircle, X, AlertCircle, Edit, Trash2, Lock, Unlock, Calendar, FileType, Link } from 'lucide-react';

const AssignmentsPage: React.FC<{ user: User }> = ({ user }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{id: string, file: File} | null>(null);
  const [sortOption, setSortOption] = useState('due-earliest');
  const [filterOption, setFilterOption] = useState<'all' | 'assigned' | 'missing' | 'done'>('all');
  
  // Derived state
  const isFaculty = user.role === UserRole.FACULTY || user.role === UserRole.TEACHER || user.role === UserRole.ADMIN;

  // Modal states
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [formError, setFormError] = useState('');
  const [createForm, setCreateForm] = useState({ title: '', subject: '', dueDate: '', dueTime: '', section: 'All', allowedFileTypes: '', resourceLink: '' });
  const [editForm, setEditForm] = useState<Assignment | null>(null);
  const [sections, setSections] = useState<string[]>([]); // State for available sections

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Sections for Modals
  useEffect(() => {
    if (isAddingAssignment || isEditingAssignment) { // Fetch sections only when modals are active
      api.getSections().then(secs => {
        setSections(secs.map((s: any) => s.name)); // Assuming API returns {id, name, ...}
      }).catch(err => console.error("Failed to fetch sections:", err));
    }
  }, [isAddingAssignment, isEditingAssignment]);

  const fetchAssignmentsAndSubmissions = async () => {
    try {
      setLoading(true);
      // Determine what to fetch based on user role
      // If student, get assignments for their section (api might handle filtering or we filter)
      // If teacher, get assignments for their managed sections
      // The API currently returns ALL assignments if no section param, or filtered by section
      
      const [assData, subData] = await Promise.all([
        api.getAssignments(user.role === 'STUDENT' ? user.section : undefined),
        api.getSubmissions()
      ]);

      setAssignments(assData);
      setSubmissions(subData);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsAndSubmissions();
  }, [user.section, user.role]);

  const getSortedAssignments = () => {
    let filtered = [...assignments];
    
    // Apply filters
    if (filterOption !== 'all') {
        filtered = filtered.filter(a => {
            const status = getStatus(a.id);
            const isLate = isSubmissionLate(a);
            
            if (filterOption === 'assigned') {
                // Active, not late, not submitted/graded
                return status === 'not-submitted' && !isLate && !a.isLocked;
            }
            if (filterOption === 'missing') {
                // Late and not submitted
                return status === 'not-submitted' && isLate;
            }
            if (filterOption === 'done') {
                // Submitted or Graded
                return status === 'pending' || status === 'graded';
            }
            return true;
        });
    }

    return filtered.sort((a, b) => {
      // ... (existing sort logic)
      const dateA = new Date(`${a.dueDate}T${a.dueTime || '23:59'}`).getTime();
      const dateB = new Date(`${b.dueDate}T${b.dueTime || '23:59'}`).getTime();

      switch (sortOption) {
        case 'due-earliest':
          return dateA - dateB;
        case 'due-latest':
          return dateB - dateA;
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        case 'subject-az':
          return a.subject.localeCompare(b.subject);
        case 'subject-za':
          return b.subject.localeCompare(a.subject);
        default:
          return 0;
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, assignmentId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile({
        id: assignmentId,
        file: file
      });
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!selectedFile || selectedFile.id !== assignmentId) return;
    setSubmitting(assignmentId);
    
    try {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('studentId', user.id);
      formData.append('studentName', user.name);
      formData.append('file', selectedFile.file);

      await api.submitAssignmentWork(formData);
      
      setTimeout(() => {
        setSubmitting(null);
        setSelectedFile(null);
        fetchAssignmentsAndSubmissions();
      }, 1200);
    } catch (error) {
      console.error("Failed to submit assignment:", error);
      alert(error.response?.data?.message || "Failed to submit assignment.");
      setSubmitting(null);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!createForm.title || !createForm.subject || !createForm.dueDate) {
      setFormError('Title, Subject, and Due Date are required.');
      return;
    }

    try {
      await api.createAssignment({
        ...createForm,
        status: 'pending' // Default status
      });
      setIsAddingAssignment(false);
      setCreateForm({ title: '', subject: '', dueDate: '', dueTime: '', section: 'All', allowedFileTypes: '', resourceLink: '' });
      fetchAssignmentsAndSubmissions();
    } catch (error) {
      console.error("Failed to create assignment:", error);
      setFormError(`Failed to create assignment: ${error.message}`);
    }
  };

  const handleEditClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditForm(assignment);
    setIsEditingAssignment(true);
  };

  const handleEditAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editForm?.title || !editForm?.subject || !editForm?.dueDate) {
      setFormError('Title, Subject, and Due Date are required.');
      return;
    }
    if (!selectedAssignment) return;

    try {
      await api.updateAssignment(selectedAssignment.id, editForm);
      setIsEditingAssignment(false);
      setSelectedAssignment(null);
      setEditForm(null);
      fetchAssignmentsAndSubmissions();
    } catch (error) {
      console.error("Failed to update assignment:", error);
      setFormError(`Failed to update assignment: ${error.message}`);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await api.deleteAssignment(id);
        fetchAssignmentsAndSubmissions();
      } catch (error) {
        console.error("Failed to delete assignment:", error);
        alert('Failed to delete assignment.');
      }
    }
  };

  const getStatus = (assignmentId: string) => {
    const sub = submissions.find(s => s.assignmentId === assignmentId);
    if (sub) return sub.status; // 'pending' or 'graded'
    return 'not-submitted';
  };
  
  const isSubmissionLate = (assignment: Assignment) => {
      if (!assignment.dueDate) return false;
      const due = new Date(`${assignment.dueDate}T${assignment.dueTime || '23:59:00'}`);
      return new Date() > due;
  };
  
  // Helper to safely get subject and resource link
  const getAssignmentDetails = (assignment: Assignment) => {
      let subject = assignment.subject;
      let link = assignment.resourceLink;

      // Legacy parsing
      if (!link && subject.includes('Resource:')) {
          const parts = subject.split('Resource:');
          subject = parts[0].trim();
          link = parts[1].trim();
      }
      return { subject, link };
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Learning Deliverables</h1>
          <p className="text-slate-500 mt-2 font-medium">Upload your classroom requirements and track teacher validation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
             {['all', 'assigned', 'missing', 'done'].map(f => (
                 <button 
                    key={f}
                    onClick={() => setFilterOption(f as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        filterOption === f 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                        : 'text-slate-400'
                    }`}
                 >
                    {f}
                 </button>
             ))}
          </div>
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-500 outline-none focus:border-indigo-500 transition-all"
          >
            <option value="due-earliest">Due: Earliest First</option>
            <option value="due-latest">Due: Latest First</option>
            <option value="title-az">Title (A-Z)</option>
            <option value="title-za">Title (Z-A)</option>
            <option value="subject-az">Subject (A-Z)</option>
            <option value="subject-za">Subject (Z-A)</option>
          </select>
          {isFaculty && (
            <button 
              onClick={() => setIsAddingAssignment(true)}
              className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
            >
              <PlusCircle size={20} />
              New Assignment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {assignments.length > 0 ? getSortedAssignments().map((item) => {
          const status = getStatus(item.id);
          const userSub = submissions.find(s => s.assignmentId === item.id);
          const isLate = isSubmissionLate(item);
          const isLocked = item.isLocked;
          const { subject, link } = getAssignmentDetails(item);

          return (
            <div key={item.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all group ${isLocked ? 'opacity-70' : ''}`}>
              <div className="flex gap-6 items-start">
                <div className={`p-4 rounded-3xl transition-colors ${
                  status === 'not-submitted' ? (isLocked || isLate ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400') :
                  status === 'pending' ? 'bg-amber-50 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {status === 'not-submitted' ? (isLocked ? <Lock size={32}/> : <FileText size={32} />) : 
                   status === 'graded' ? <CheckCircle size={32} /> : 
                   <Clock size={32} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white leading-none">
                        {item.title} 
                        {isLocked && <span className="ml-2 text-rose-500 text-xs uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg">Closed</span>}
                        {isLate && !isLocked && <span className="ml-2 text-orange-500 text-xs uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-lg">Past Due</span>}
                    </h3>
                    {isFaculty && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                          title="Edit Assignment"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAssignment(item.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                          title="Delete Assignment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">{subject}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Target: {item.dueDate} {item.dueTime ? `@ ${item.dueTime}` : ''}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Section: {item.section || 'All'}</span>
                        {item.allowedFileTypes && (
                            <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <FileType size={10} /> {item.allowedFileTypes}
                            </span>
                            </>
                        )}
                    </div>
                    {link && (
                        <div className="mt-2">
                             <a 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                             >
                                <Link size={12} /> View Resource
                             </a>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              {!isFaculty && (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {status === 'not-submitted' ? (
                    <>
                      {isLocked || isLate ? (
                          <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 cursor-not-allowed">
                              {isLocked ? <Lock size={16} /> : <Clock size={16} />}
                              {isLocked ? 'Submissions Closed' : 'Deadline Passed'}
                          </div>
                      ) : (
                          <>
                            {selectedFile?.id === item.id ? (
                                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <span className="text-[10px] font-bold truncate max-w-[150px]">{selectedFile.file.name}</span>
                                <button onClick={() => setSelectedFile(null)} className="text-rose-500 font-black">X</button>
                                </div>
                            ) : (
                                <button 
                                onClick={() => {
                                    const input = document.getElementById(`file-${item.id}`);
                                    input?.click();
                                }} 
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-colors"
                                >
                                <UploadCloud size={16} /> Choose File
                                </button>
                            )}
                            <input 
                                type="file" 
                                id={`file-${item.id}`} 
                                className="hidden" 
                                accept={item.allowedFileTypes ? item.allowedFileTypes.split(',').map(e => e.trim().startsWith('.') ? e.trim() : '.' + e.trim()).join(',') : '*'}
                                onChange={(e) => handleFileChange(e, item.id)} 
                            />
                            
                            <button 
                                onClick={() => handleSubmit(item.id)} 
                                disabled={!selectedFile || selectedFile.id !== item.id || submitting === item.id} 
                                className="px-8 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {submitting === item.id ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                                Submit
                            </button>
                          </>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${
                        status === 'graded' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      }`}>
                        {status === 'graded' ? <CheckCircle2 size={16} /> : <CheckCircle size={16} />}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {status === 'graded' ? `Score: ${userSub?.grade}/100` : 'Submitted'}
                        </span>
                      </div>
                      {userSub?.fileName && (
                        <p className="text-[9px] font-bold text-slate-400 italic">Attached: {userSub.fileName}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }) : (
            <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                No assignments found for your section.
            </div>
        )}
      </div>

      {/* Add Assignment Modal */}
      {isAddingAssignment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <PlusCircle size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">New Assignment</h3>
                </div>
                <button onClick={() => setIsAddingAssignment(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleCreateAssignment} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Title</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="e.g., Essay on Rizal"
                    value={createForm.title}
                    onChange={e => setCreateForm({...createForm, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Subject</label>
                    <input 
                      type="text" required
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                      placeholder="e.g., Filipino"
                      value={createForm.subject}
                      onChange={e => setCreateForm({...createForm, subject: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Due Date</label>
                    <input 
                      type="date" required
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                      value={createForm.dueDate}
                      onChange={e => setCreateForm({...createForm, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Section</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={createForm.section}
                    onChange={e => setCreateForm({...createForm, section: e.target.value})}
                  >
                    <option value="All">All Sections</option>
                    {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingAssignment(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    Create Assignment
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {isEditingAssignment && selectedAssignment && editForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <Edit size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Edit Assignment</h3>
                </div>
                <button onClick={() => setIsEditingAssignment(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleEditAssignment} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Title</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Subject</label>
                    <input 
                      type="text" required
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                      value={editForm.subject}
                      onChange={e => setEditForm({...editForm, subject: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Due Date</label>
                    <input 
                      type="date" required
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                      value={editForm.dueDate}
                      onChange={e => setEditForm({...editForm, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Section</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={editForm.section || 'All'}
                    onChange={e => setEditForm({...editForm, section: e.target.value})}
                  >
                    <option value="All">All Sections</option>
                    {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingAssignment(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex items-center gap-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 p-10 opacity-5 -rotate-12 translate-x-1/4 -translate-y-1/4">
          <Info size={200} />
        </div>
        <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center text-white shrink-0">
          <Info size={32} />
        </div>
        <div>
          <h4 className="text-xl font-black uppercase tracking-tighter">Submission Protocol</h4>
          <p className="text-sm text-white/60 font-medium max-w-2xl leading-relaxed mt-1">
            Learning materials submitted digitally remain archived in your portfolio. Once a teacher provides feedback, the status will shift from "Reviewing" to "Graded".
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;