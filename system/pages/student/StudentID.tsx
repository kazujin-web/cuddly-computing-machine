import React, { useRef } from 'react';
import { User } from '../../types';
import { Download, Printer, ShieldCheck, Mail, Phone, MapPin, BadgeCheck, UserCheck } from 'lucide-react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';

const LOGO_URL = "https://raw.githubusercontent.com/Golgrax/randompublicimagefreetouse/refs/heads/main/logo.png";

const StudentID: React.FC<{ user: User }> = ({ user }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const pfp = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1A237E&color=fff&size=512`;
  
  // Use School Year from DB or fallback
  const schoolYear = user.schoolYear || "2025-2026";
  
  // Generate Data Hash
  // For Login purposes, we will encode the User ID directly.
  // This allows the scanner to instantly identify the user record.
  const qrHash = user.id;

  const handleDownload = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2 // Higher resolution
      });
      const link = document.createElement('a');
      link.download = `Student-ID-${user.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handlePrint = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#ffffff', // Ensure white background for print
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Student ID - ${user.name}</title>
              <style>
                body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                img { max-width: 100%; max-height: 100%; object-fit: contain; }
                @media print {
                  @page { margin: 0; size: landscape; }
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" onload="window.print();window.close()" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-black text-school-navy dark:text-white tracking-tight uppercase">Digital Learner ID</h1>
        <p className="text-slate-500 mt-2 font-medium">Official identity card for Academic Year {schoolYear}.</p>
      </div>

      <div className="flex justify-center">
        {/* Placeholder for Student ID Image */}
        <div className="p-10 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 dark:bg-slate-800 text-center">
            <p className="text-slate-400 font-bold mb-4">Student ID Image</p>
            {/* You can replace the src below with the actual image URL when provided */}
            <img src="https://placehold.co/600x400?text=Student+ID+Image" alt="Student ID" className="max-w-full h-auto rounded-xl shadow-lg" />
        </div>
      </div>

      {/* Buttons removed as requested */}

    </div>
  );
};

export default StudentID;