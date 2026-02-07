import React, { ReactNode, useState } from 'react';
import { Role } from '../types';
import { FileText, Contact, LayoutDashboard, Users, Bell, Menu, LogOut, ChevronLeft, UserCircle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  role: Role;
  setRole: (role: Role) => void;
  currentView: string;
  setView: (view: string) => void;
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, role, setRole, currentView, setView, userName }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-gray-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white w-64 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'ml-0' : '-ml-64'} fixed h-full z-20 print:hidden shadow-xl`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">SN</div>
          <div>
            <h1 className="font-bold text-lg leading-none">Sto. Niño</h1>
            <p className="text-[10px] text-blue-400 font-medium tracking-widest uppercase">Portal System 2</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {role === Role.STUDENT && (
            <>
              <button 
                onClick={() => setView('sf9')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${currentView === 'sf9' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <FileText size={18} />
                <span className="font-medium">SF9 Viewer</span>
              </button>
              <button 
                onClick={() => setView('id')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${currentView === 'id' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <Contact size={18} />
                <span className="font-medium">Student ID</span>
              </button>
            </>
          )}

          {role === Role.TEACHER && (
            <>
              <button 
                onClick={() => setView('grading')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${currentView === 'grading' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <LayoutDashboard size={18} />
                <span className="font-medium">Grading Sheet</span>
              </button>
              <button 
                onClick={() => setView('masterlist')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${currentView === 'masterlist' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <Users size={18} />
                <span className="font-medium">Masterlist</span>
              </button>
            </>
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-slate-800/50">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName || role)}&background=random`} alt="Profile" className="w-10 h-10 rounded-full border-2 border-slate-700" />
                <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{userName || 'User'}</p>
                    <p className="text-[10px] text-blue-400 uppercase font-bold tracking-tighter">{role}</p>
                </div>
            </div>
            <button 
                onClick={() => setRole(role === Role.STUDENT ? Role.TEACHER : Role.STUDENT)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-xs py-2.5 rounded-lg text-slate-300 transition-colors flex items-center justify-center gap-2 border border-slate-700">
                <LogOut size={14} />
                Switch Role (Demo)
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} print:ml-0`}>
        {/* Top Navbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 print:hidden">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 relative transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                <div className="flex items-center gap-2">
                    <UserCircle size={24} className="text-gray-400" />
                </div>
            </div>
        </header>

        <div className="p-8 print:p-0 min-h-[calc(100vh-64px)]">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;