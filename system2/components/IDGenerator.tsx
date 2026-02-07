import React from 'react';
import QRCode from 'react-qr-code';
import { Student } from '../types';

interface IDGeneratorProps {
  student: Student;
}

const IDGenerator: React.FC<IDGeneratorProps> = ({ student }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div id="id-card" className="w-[350px] h-[550px] bg-white rounded-xl shadow-2xl overflow-hidden relative border border-gray-200 print:shadow-none print:border">
        {/* Header / Background Pattern */}
        <div className="absolute top-0 w-full h-32 bg-blue-700 z-0">
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-400 rounded-full opacity-50"></div>
           <div className="absolute top-10 -left-10 w-20 h-20 bg-blue-500 rounded-full opacity-50"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center pt-8 h-full">
          {/* Logos */}
          <div className="flex items-center gap-2 mb-4 w-full justify-center px-4">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                <span className="text-[8px] font-bold text-center">DEPED</span>
             </div>
             <div className="text-center text-white">
                <h1 className="font-bold text-sm tracking-widest">STO. NIÑO</h1>
                <h2 className="text-[10px] font-light">ELEMENTARY SCHOOL</h2>
             </div>
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
               <span className="text-[8px] font-bold text-center">SCHOOL</span>
             </div>
          </div>

          {/* Photo */}
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 mb-4">
            <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
          </div>

          {/* Student Details */}
          <div className="text-center w-full px-6 flex-grow">
            <h2 className="text-2xl font-bold text-gray-800 uppercase leading-tight mb-1">{student.name}</h2>
            <p className="text-blue-600 font-semibold text-lg mb-4">Student</p>
            
            <div className="grid grid-cols-2 gap-2 text-left text-sm bg-gray-50 p-4 rounded-lg">
                <div className="text-gray-500 text-xs">LRN</div>
                <div className="font-bold text-right">{student.lrn}</div>
                <div className="text-gray-500 text-xs">Grade</div>
                <div className="font-bold text-right">{student.gradeLevel}</div>
                <div className="text-gray-500 text-xs">Section</div>
                <div className="font-bold text-right">{student.section}</div>
            </div>
          </div>

          {/* Footer / QR */}
          <div className="w-full bg-gray-100 p-4 mt-auto border-t border-gray-200 flex items-center justify-between">
             <div className="flex-1">
                <p className="text-[8px] text-gray-500 text-center">
                    If found, please return to:<br/>
                    Sto. Niño Elementary School<br/>
                    Parañaque City
                </p>
             </div>
             <div className="bg-white p-1 rounded shadow-sm">
                <QRCode value={`STUDENT:${student.lrn}`} size={48} />
             </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex gap-4 no-print">
        <button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
            Print ID
        </button>
      </div>
    </div>
  );
};

export default IDGenerator;