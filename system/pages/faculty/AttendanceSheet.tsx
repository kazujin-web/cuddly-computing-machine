import React, { useState, useEffect, useRef } from 'react';
import { User, AttendanceRecord, UserRole } from '../../types';
import { api } from '../../src/api';
import { Calendar, UserCheck, Save, Loader2, Filter, Search, Layers, X, CheckCircle2, Download, Upload, QrCode } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Html5QrcodeScanner } from 'html5-qrcode';

const AttendanceSheet: React.FC<{ user: User }> = ({ user }) => {
  // State
  const [students, setStudents] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  
  // Parse Sections
  let assignedSections: string[] = [];
  try {
      assignedSections = typeof user.assignedSections === 'string' 
        ? JSON.parse(user.assignedSections) 
        : (user.assignedSections || []);
  } catch (e) { assignedSections = []; }

  const [activeSection, setActiveSection] = useState(assignedSections[0] || 'All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Bulk State
  const [bulkStartDate, setBulkStartDate] = useState(selectedDate);
  const [bulkEndDate, setBulkEndDate] = useState(selectedDate);
  const [bulkStatus, setBulkStatus] = useState<'present' | 'absent' | 'late' | 'excused'>('present');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
        const [usersData, attData] = await Promise.all([
            api.getUsers(activeSection === 'All' ? '' : activeSection),
            api.getAttendance('', selectedDate)
        ]);
        
        // Filter students locally if 'All' is selected to ensure we only get STUDENTS
        // If activeSection is specific, API likely filtered it, but checking role is safe
        const filteredStudents = usersData.filter(u => u.role === 'STUDENT' && (activeSection === 'All' || u.section === activeSection));
        
        setStudents(filteredStudents);
        setAttendance(attData);
    } catch (e) {
        console.error("Error fetching data:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSection, selectedDate]);

  // Scanner Logic
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render((decodedText) => {
        // Assuming decodedText is the student ID
        const student = students.find(s => s.id === decodedText || s.lrn === decodedText);
        
        if (student) {
            handleStatusChange(student.id, 'present');
            // Provide visual/audio feedback? For now alert is simple but intrusive.
            // Better to use a toast, but keeping it simple as per original
            alert(`Marked ${student.name} as Present`);
        } else {
            console.warn(`Student not found for ID: ${decodedText}`);
        }
      }, (error) => {
        console.warn(error);
      });

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [showScanner, students]);

  // Handlers
  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    // Optimistic Update
    setAttendance(prev => {
        const existing = prev.find(a => a.studentId === studentId && a.date === selectedDate);
        if (existing) {
            return prev.map(a => a.studentId === studentId && a.date === selectedDate ? { ...a, status } : a);
        } else {
            return [...prev, { id: 'temp-' + Date.now(), studentId, date: selectedDate, status }];
        }
    });
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
        // Save all records for the current date
        // We only need to send the ones that changed or exist.
        // Simple approach: Send requests for all current students' status
        
        // Filter attendance records for current students and date
        const recordsToSave = attendance.filter(a => 
            a.date === selectedDate && students.some(s => s.id === a.studentId)
        );

        await Promise.all(recordsToSave.map(att => 
            api.postAttendance({ studentId: att.studentId, date: att.date, status: att.status })
        ));
        
        await fetchData(); // Refresh to get real IDs
        alert('Attendance saved successfully!');
    } catch (e) {
        console.error("Failed to save:", e);
        alert('Failed to save attendance.');
    } finally {
        setSaving(false);
    }
  };

  const handleBulkUpdate = async () => {
      setIsSavingBulk(true);
      try {
          const studentIds = students.map(s => s.id);
          await api.postAttendanceBulk({
              studentIds,
              startDate: bulkStartDate,
              endDate: bulkEndDate,
              status: bulkStatus
          });
          setIsBulkModalOpen(false);
          fetchData();
          alert('Bulk attendance updated!');
      } catch (e) {
          console.error("Bulk update failed:", e);
          alert('Failed to update bulk attendance.');
      } finally {
          setIsSavingBulk(false);
      }
  };

  const handleExportAttendance = () => {
      const data = students.map(student => {
          const att = attendance.find(a => a.studentId === student.id && a.date === selectedDate);
          return {
              'Student Name': student.name,
              'LRN': student.lrn,
              'Section': student.section,
              'Date': selectedDate,
              'Status': att ? att.status.toUpperCase() : 'UNMARKED'
          };
      });
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `Attendance_${activeSection}_${selectedDate}.xlsx`);
  };

  const handleImportAttendance = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          // Assuming structure has 'LRN' or 'Student Name' and 'Status'
          // We map back to students
          const newAttendance = [...attendance];
          
          data.forEach((row: any) => {
              const lrn = row['LRN'];
              const status = row['Status']?.toLowerCase();
              
              if (lrn && status && ['present','absent','late','excused'].includes(status)) {
                  const student = students.find(s => s.lrn == lrn);
                  if (student) {
                      // Update local state
                      const existingIdx = newAttendance.findIndex(a => a.studentId === student.id && a.date === selectedDate);
                      if (existingIdx >= 0) {
                          newAttendance[existingIdx] = { ...newAttendance[existingIdx], status };
                      } else {
                          newAttendance.push({ id: 'temp-'+Math.random(), studentId: student.id, date: selectedDate, status });
                      }
                  }
              }
          });
          setAttendance(newAttendance);
          alert('Imported! Click Save to persist changes.');
      };
      reader.readAsBinaryString(file);
  };

  const getStatus = (studentId: string) => {
      const rec = attendance.find(a => a.studentId === studentId && a.date === selectedDate);
      return rec ? rec.status : null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Class Attendance</h1>
          <p className="text-slate-500 mt-2 font-medium">Daily attendance tracking for your sections.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowScanner(!showScanner)}
            className={`flex items-center gap-3 px-6 py-4 border rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-transform ${showScanner ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <QrCode size={18} /> {showScanner ? 'Close Scanner' : 'QR Scanner'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImportAttendance}
            className="hidden"
            accept=".xlsx, .xls"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-transform"
          >
            <Upload size={18} /> Import
          </button>
          <button 
            onClick={handleExportAttendance}
            className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-transform"
          >
            <Download size={18} /> Export
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-transform"
          >
            <Layers size={18} /> Bulk Update
          </button>
          <button 
            onClick={saveAttendance}
            disabled={saving || loading}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md relative">
            <button 
                onClick={() => setShowScanner(false)}
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
            >
                <X size={20} />
            </button>
            <h3 className="text-xl font-black text-school-navy mb-4 text-center uppercase tracking-tight">Scan Student ID</h3>
            <div id="reader" className="overflow-hidden rounded-xl"></div>
            <p className="text-center text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">Point camera at ID card</p>
            </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500">
             <Filter size={20} />
           </div>
           <div className="flex-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Section</label>
                <select 
                  className="w-full bg-transparent font-bold text-slate-800 dark:text-white outline-none border-b border-slate-200 dark:border-slate-700 py-2"
                  value={activeSection}
                  onChange={e => setActiveSection(e.target.value)}
                >
                  <option value="All">All Learners</option>
               {assignedSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
             </select>
           </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500">
             <Calendar size={20} />
           </div>
           <div className="flex-1">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Date</label>
             <input 
               type="date"
               className="w-full bg-transparent font-bold text-slate-800 dark:text-white outline-none border-b border-slate-200 dark:border-slate-700 py-2"
               value={selectedDate}
               onChange={e => setSelectedDate(e.target.value)}
             />
           </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-4">
          {loading ? (
              <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
          ) : students.length > 0 ? (
              students.map(student => {
                  const status = getStatus(student.id);
                  const pfp = student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;
                  
                  return (
                    <div key={student.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 flex-1">
                            <img src={pfp} alt={student.name} className="w-16 h-16 rounded-2xl object-cover" />
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">{student.name}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{student.section}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-2">
                            {['present', 'late', 'absent', 'excused'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(student.id, s as any)}
                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        status === s 
                                        ? s === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                                          s === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' :
                                          s === 'late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                                          'bg-blue-500 text-white shadow-lg shadow-blue-200'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                  );
              })
          ) : (
              <div className="p-20 text-center text-slate-400 font-bold">No students found for this section.</div>
          )}
      </div>

      {/* Bulk Update Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <Layers size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Bulk Attendance</h3>
                </div>
                <button onClick={() => setIsBulkModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Start Date</label>
                    <input 
                      type="date"
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm"
                      value={bulkStartDate}
                      onChange={e => setBulkStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">End Date</label>
                    <input 
                      type="date"
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm"
                      value={bulkEndDate}
                      onChange={e => setBulkEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Set Status For All</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['present', 'late', 'absent', 'excused'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setBulkStatus(s as any)}
                        className={`px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                          bulkStatus === s 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                            : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setIsBulkModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                <button 
                  onClick={handleBulkUpdate}
                  disabled={isSavingBulk}
                  className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                >
                  {isSavingBulk ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Apply to {students.length} Learners
                </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;