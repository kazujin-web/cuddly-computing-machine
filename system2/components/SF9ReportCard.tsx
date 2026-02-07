import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, Download, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const LOGO_URL = "https://raw.githubusercontent.com/Golgrax/randompublicimagefreetouse/refs/heads/main/logo.png";

const SF9ReportCard: React.FC<{ data: any }> = ({ data: initialData }) => {
  const [workbook, setWorkbook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    axios.get('/api/workbook')
      .then(res => setWorkbook(res.data))
      .catch(err => console.error('SF9 Workbook Load Error:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Generating Digital SF9...</p>
    </div>
  );

  if (!workbook) return <div className="p-8 text-center text-red-500 font-bold">CRITICAL ERROR: WORKBOOK NOT FOUND</div>;

  const frontData = workbook.sheets['K-12 Front'] || [];
  const insideData = workbook.sheets['Grade 5 Inside'] || [];

  return (
    <div className="bg-[#525659] h-[calc(100vh-64px)] overflow-auto flex flex-col items-center py-8 px-4 custom-scrollbar relative">
      
      {/* PDF-like Toolbar */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#323639] text-white px-6 py-2 rounded-full shadow-2xl border border-[#4a4d51] flex items-center gap-6 no-print">
         <div className="flex items-center gap-2 border-r border-gray-600 pr-4">
            <FileText size={18} className="text-blue-400" />
            <span className="text-xs font-bold truncate max-w-[150px]">SF9_2025_2026.pdf</span>
         </div>
         <div className="flex items-center gap-4 border-r border-gray-600 pr-4 text-xs font-bold">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="hover:text-blue-400">-</button>
            <span>{zoom}%</span>
            <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="hover:text-blue-400">+</button>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => window.print()} className="hover:text-blue-400 flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
               <Printer size={16} /> Print
            </button>
            <button onClick={() => window.open('/api/download-excel', '_blank')} className="hover:text-green-400 flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
               <Download size={16} /> Save .xlsx
            </button>
         </div>
      </div>

      <div className="space-y-12 transition-all duration-500 origin-top" style={{ transform: `scale(${zoom/100})` }}>
        
        {/* PAGE 1: EXTERNAL (FRONT/BACK) */}
        <div className="bg-white w-[11in] h-[8.5in] shadow-2xl p-[0.5in] flex divide-x divide-gray-300 print:shadow-none print:m-0 print:border-none border border-gray-200">
            {/* BACK PANEL: Attendance */}
            <div className="w-1/2 pr-8 flex flex-col">
                <h3 className="text-center font-bold text-[11pt] mb-4 uppercase tracking-tight underline underline-offset-4">Report on Attendance</h3>
                <div className="flex-grow">
                    <ExcelTable data={frontData.slice(3, 10)} isAttendance />
                </div>
                <div className="mt-8 pt-4 border-t-2 border-black space-y-4">
                    <p className="text-[10pt] text-justify leading-tight italic">This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values.</p>
                    <div className="grid grid-cols-2 gap-8 text-center pt-8">
                        <div>
                            <div className="border-b border-black font-bold uppercase text-[9pt]">Maria Santos</div>
                            <div className="text-[8pt] uppercase">Teacher</div>
                        </div>
                        <div>
                            <div className="border-b border-black font-bold uppercase text-[9pt]">Juan dela Cruz</div>
                            <div className="text-[8pt] uppercase">Principal</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FRONT PANEL: School Info */}
            <div className="w-1/2 pl-8 flex flex-col items-center">
                <div className="text-center space-y-1 mb-8">
                    <p className="text-[9pt] uppercase">Republic of the Philippines</p>
                    <p className="text-[11pt] font-bold uppercase">Department of Education</p>
                    <p className="text-[9pt]">National Capital Region</p>
                    <p className="text-[9pt]">Division of Parañaque City</p>
                    
                    <div className="py-4 flex items-center justify-center gap-4">
                        <img src={LOGO_URL} className="w-20 h-20 object-contain" alt="Logo" />
                        <div className="text-left border-l-2 border-school-navy pl-4">
                            <h1 className="text-[16pt] font-black text-school-navy uppercase leading-none">Sto. Niño</h1>
                            <h2 className="text-[10pt] font-bold text-school-gold uppercase tracking-widest">Elementary School</h2>
                        </div>
                    </div>
                </div>

                <div className="w-full flex-grow flex flex-col justify-center space-y-8">
                    <div className="bg-school-navy text-white py-2 text-center font-black text-lg uppercase tracking-[0.2em]">Learner's Progress Report Card</div>
                    
                    <div className="w-full space-y-4 px-8">
                        <div className="flex border-b border-black gap-2 items-end pb-1">
                            <span className="text-[10pt] font-bold uppercase min-w-[60px]">Name:</span>
                            <span className="text-[12pt] font-black uppercase text-blue-800">{frontData[15]?.[16] || "STUDENT NAME"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex border-b border-black gap-2 items-end pb-1">
                                <span className="text-[9pt] font-bold uppercase">Age:</span>
                                <span className="text-[10pt] font-bold">11</span>
                            </div>
                            <div className="flex border-b border-black gap-2 items-end pb-1">
                                <span className="text-[9pt] font-bold uppercase">Sex:</span>
                                <span className="text-[10pt] font-bold uppercase">MALE</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex border-b border-black gap-2 items-end pb-1">
                                <span className="text-[9pt] font-bold uppercase">LRN:</span>
                                <span className="text-[10pt] font-bold tracking-widest">123456789012</span>
                            </div>
                            <div className="flex border-b border-black gap-2 items-end pb-1">
                                <span className="text-[9pt] font-bold uppercase">Grade:</span>
                                <span className="text-[10pt] font-bold uppercase">Grade 5 - Rizal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* PAGE 2: INTERNAL (GRADES/VALUES) */}
        <div className="bg-white w-[11in] h-[8.5in] shadow-2xl p-[0.5in] flex divide-x divide-gray-300 print:shadow-none print:m-0 print:border-none border border-gray-200">
            <div className="w-1/2 pr-8">
                <h3 className="text-center font-bold text-[10pt] mb-4 uppercase tracking-tight">Report on Learning Progress and Achievement</h3>
                <ExcelTable data={insideData.slice(2, 18)} isGrades />
            </div>
            <div className="w-1/2 pl-8">
                <h3 className="text-center font-bold text-[10pt] mb-4 uppercase tracking-tight">Report on Learner's Observed Values</h3>
                <ExcelTable data={insideData.slice(2, 18)} isValues skipCols={8} />
            </div>
        </div>

      </div>
    </div>
  );
};

const ExcelTable = ({ data, skipCols = 0, isGrades, isValues, isAttendance }: { data: any[][], skipCols?: number, isGrades?: boolean, isValues?: boolean, isAttendance?: boolean }) => (
    <table className="w-full border-collapse border border-black text-[8.5pt] shadow-sm">
        <tbody>
            {data.map((row, i) => {
                if (!row || row.every(c => c === "")) return null;
                
                // DETECT SECTION HEADERS (e.g. MALE / FEMALE)
                const isSectionHeader = row.some(c => typeof c === 'string' && (c.includes('MALE') || c.includes('FEMALE')));
                
                return (
                    <tr key={i} className={`${i === 0 ? 'bg-gray-100 font-bold' : ''} ${isSectionHeader ? 'bg-[#d8d8d8] text-[#00b0f0] font-black h-8' : ''}`}>
                        {row.slice(skipCols).map((cell, j) => {
                            const isHeader = i === 0 || i === 1;
                            // SYLING MATCHING THE PROVIDED GSHEET EXPORT
                            const cellStyle = `
                                border border-black p-1 text-center h-7 
                                ${isHeader ? 'font-bold bg-[#f3f3f3]' : ''} 
                                ${j === 0 ? 'text-left px-2 font-bold min-w-[180px] bg-white' : ''}
                                ${typeof cell === 'number' && cell < 75 ? 'text-red-600 font-bold' : ''}
                                ${isSectionHeader ? 'text-center border-none' : ''}
                            `;
                            
                            return (
                                <td key={j} className={cellStyle}>
                                    {cell}
                                </td>
                            );
                        })}
                    </tr>
                );
            })}
        </tbody>
    </table>
);

export default SF9ReportCard;