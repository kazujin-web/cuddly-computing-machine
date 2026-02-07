import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Save, FileSpreadsheet, 
  Search, Bold, Italic, Type, 
  ChevronDown, Share2, Printer, 
  HelpCircle, MessageSquare, History,
  Undo, Redo, PaintBucket, BorderAll,
  AlignCenter, AlignLeft, AlignRight,
  Filter, FunctionSquare
} from 'lucide-react';
import axios from 'axios';

const GradingSheet: React.FC = () => {
  const [workbook, setWorkbook] = useState<any>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [source, setSource] = useState<'local' | 'gsheet'>('local');
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [formulaValue, setFormulaValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWorkbook();
  }, [source]);

  const fetchWorkbook = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/workbook?source=${source}`);
      setWorkbook(res.data);
      if (res.data.sheetNames.length > 0) {
        const defaultSheet = res.data.sheetNames.find((s: string) => s.includes('QUARTER 1')) || res.data.sheetNames[0];
        setActiveSheet(defaultSheet);
      }
    } catch (err) {
      console.error('Failed to fetch workbook:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToCloud = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/sync-to-gsheet');
      alert('Local data pushed to Google Sheets successfully!');
    } catch (err) {
      alert('Sync failed. Make sure credentials.json is configured.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (!workbook || !activeSheet) return;
    const newWorkbook = { ...workbook };
    newWorkbook.sheets[activeSheet][rowIndex][colIndex] = value;
    setWorkbook(newWorkbook);
    if (selectedCell?.r === rowIndex && selectedCell?.c === colIndex) {
      setFormulaValue(value);
    }
  };

  const handleSaveSheet = async () => {
    if (!workbook || !activeSheet) return;
    setIsSaving(true);
    try {
      await axios.post('/api/workbook', {
        sheetName: activeSheet,
        data: workbook.sheets[activeSheet]
      });
      alert('Changes saved successfully!');
    } catch (err) {
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const getColumnName = (index: number) => {
    let name = '';
    while (index >= 0) {
      name = String.fromCharCode((index % 26) + 65) + name;
      index = Math.floor(index / 26) - 1;
    }
    return name;
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-full bg-white space-y-4">
      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">Opening Spreadsheet...</p>
    </div>
  );

  const currentSheetData = workbook?.sheets[activeSheet] || [];

  return (
    <div className="bg-[#f8f9fa] h-full flex flex-col overflow-hidden text-sm select-none">
      
      {/* 1. Top Google Sheets Menu Bar */}
      <div className="bg-white border-b border-gray-300 px-4 py-1 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`${source === 'gsheet' ? 'bg-green-600' : 'bg-blue-600'} p-1.5 rounded transition-colors shadow-md`}>
            <FileSpreadsheet className="text-white" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-800">Sto. Niño Portal - Grading System</h1>
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button 
                  onClick={() => setSource('local')}
                  className={`px-3 py-0.5 rounded-md text-[10px] font-black uppercase transition-all ${source === 'local' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>Local</button>
                <button 
                  onClick={() => setSource('gsheet')}
                  className={`px-3 py-0.5 rounded-md text-[10px] font-black uppercase transition-all ${source === 'gsheet' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400'}`}>GSheet</button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-gray-600 mt-0.5 font-medium">
              <span className="hover:bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer">File</span>
              <span className="hover:bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer">Edit</span>
              <span className="hover:bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer">View</span>
              <span className="hover:bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer text-blue-600 font-bold" onClick={handleSaveSheet}>Save Local</span>
              <span className="hover:bg-green-50 px-1.5 py-0.5 rounded cursor-pointer text-green-600 font-bold" onClick={handleSyncToCloud}>Sync to Cloud</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-[#c2e7ff] hover:bg-[#b3d7ef] text-[#001d35] px-4 py-2 rounded-full font-medium transition-colors">
            <Share2 size={18} />
            Share
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">M</div>
        </div>
      </div>

      {/* 2. Google Sheets Toolbar */}
      <div className="bg-[#edf2fa] border-b border-gray-300 mx-2 mt-2 rounded-full px-4 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-sm">
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <Search size={16} className="text-gray-500 mx-1" />
          <Undo size={16} className="text-gray-400 opacity-50 mx-1" />
          <Redo size={16} className="text-gray-400 opacity-50 mx-1" />
          <Printer size={16} className="text-gray-600 mx-1 cursor-pointer hover:bg-gray-200 p-0.5 rounded" />
        </div>
        <div className="flex items-center gap-1 px-2 border-r border-gray-300">
          <span className="text-[12px] font-medium text-gray-700 px-2">100%</span>
          <ChevronDown size={14} className="text-gray-500" />
        </div>
        <div className="flex items-center gap-1 px-2 border-r border-gray-300">
          <Type size={16} className="text-gray-600 mx-1" />
          <span className="text-[12px] font-medium text-gray-700 px-2">Arial</span>
          <ChevronDown size={14} className="text-gray-500" />
        </div>
        <div className="flex items-center gap-1 px-2">
          <Bold size={16} className="text-gray-600 mx-1 hover:bg-gray-200 p-0.5 rounded cursor-pointer" />
          <Italic size={16} className="text-gray-600 mx-1 hover:bg-gray-200 p-0.5 rounded cursor-pointer" />
          <PaintBucket size={16} className="text-gray-600 mx-1 hover:bg-gray-200 p-0.5 rounded cursor-pointer" />
          <BorderAll size={16} className="text-gray-600 mx-1 hover:bg-gray-200 p-0.5 rounded cursor-pointer" />
          <AlignCenter size={16} className="text-gray-600 mx-1 hover:bg-gray-200 p-0.5 rounded cursor-pointer" />
        </div>
        <div className="ml-auto flex items-center gap-2">
           <button onClick={() => window.open('/api/download-excel', '_blank')} className="text-green-700 hover:bg-green-50 px-3 py-1 rounded-md flex items-center gap-1 font-medium text-xs border border-green-200">
             <Download size={14} /> Export
           </button>
        </div>
      </div>

      {/* 3. Formula Bar */}
      <div className="bg-white border-b border-gray-300 flex items-center h-9 shadow-inner">
        <div className="w-16 h-full flex items-center justify-center font-mono text-gray-500 border-r border-gray-200 bg-gray-50 italic">
          {selectedCell ? `${getColumnName(selectedCell.c)}${selectedCell.r + 1}` : ''}
        </div>
        <div className="px-3 text-gray-400 font-serif italic text-lg leading-none select-none">fx</div>
        <div className="flex-1 h-full">
          <input 
            className="w-full h-full px-2 outline-none font-medium text-[13px]" 
            value={formulaValue}
            onChange={(e) => {
              setFormulaValue(e.target.value);
              if (selectedCell) handleCellChange(selectedCell.r, selectedCell.c, e.target.value);
            }}
          />
        </div>
      </div>

      {/* 4. Main Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-[#f8f9fa] relative custom-scrollbar" ref={scrollRef}>
        <div className="inline-block min-w-full">
          <table className="border-collapse table-fixed w-full">
            <thead>
              <tr className="h-6 bg-[#f8f9fa] sticky top-0 z-20">
                <th className="w-10 border border-gray-300 bg-gray-100 sticky left-0 z-30"></th>
                {currentSheetData[0]?.map((_: any, i: number) => (
                  <th key={i} className="min-w-[100px] border border-gray-300 font-medium text-gray-500 text-[11px] bg-gray-100 hover:bg-gray-200 transition-colors">
                    {getColumnName(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentSheetData.map((row: any[], rIndex: number) => (
                <tr key={rIndex} className="h-8">
                  <td className="border border-gray-300 bg-gray-100 text-center font-medium text-gray-500 text-[11px] sticky left-0 z-10 w-10">
                    {rIndex + 1}
                  </td>
                  {row.map((cell: any, cIndex: number) => {
                    const isSelected = selectedCell?.r === rIndex && selectedCell?.c === cIndex;
                    return (
                      <td 
                        key={cIndex} 
                        onClick={() => {
                          setSelectedCell({r: rIndex, c: cIndex});
                          setFormulaValue(cell || '');
                        }}
                        onDoubleClick={() => {
                          // Could trigger a more intense edit mode
                        }}
                        className={`border border-gray-200 p-0 relative transition-all ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-40' : ''}`}
                      >
                        <input 
                          className={`w-full h-full px-2 outline-none bg-transparent cursor-cell text-[12px] ${rIndex === 0 ? 'font-bold text-gray-800' : 'text-gray-700'}`}
                          value={cell || ''}
                          onChange={(e) => handleCellChange(rIndex, cIndex, e.target.value)}
                        />
                        {isSelected && (
                          <div className="absolute bottom-[-4px] right-[-4px] w-2 h-2 bg-blue-500 border border-white z-50 cursor-crosshair"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bottom Tab Bar (Google Sheets Style) */}
      <div className="bg-[#f8f9fa] border-t border-gray-300 flex items-center h-10 px-2 overflow-hidden">
        <div className="flex items-center gap-1 mr-4">
          <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"><ChevronDown size={16} /></button>
          <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"><Search size={16} /></button>
        </div>
        <div className="flex h-full items-end overflow-x-auto no-scrollbar pr-20">
          {workbook?.sheetNames.map((name: string) => (
            <button
              key={name}
              onClick={() => setActiveSheet(name)}
              className={`h-8 px-6 text-[12px] font-medium whitespace-nowrap border-x border-gray-300 transition-all flex items-center gap-2 rounded-t-sm
                ${activeSheet === name 
                  ? 'bg-white text-[#1a73e8] border-t-2 border-t-[#1a73e8] shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {name}
              <ChevronDown size={12} className={activeSheet === name ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center bg-white h-full px-4 border-l border-gray-300">
           <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
             <History size={12} /> Last saved {isSaving ? 'just now' : 'recently'}
           </span>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; border: 2px solid #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
      `}</style>
    </div>
  );
};

export default GradingSheet;