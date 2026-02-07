import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SF9ReportCard from './components/SF9ReportCard';
import IDGenerator from './components/IDGenerator';
import GradingSheet from './components/GradingSheet';
import Masterlist from './components/Masterlist';
import { SF9Data, Student, Role } from './types';
import axios from 'axios';

const API_BASE_URL = '/api';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [currentView, setView] = useState<string>('sf9');
  const [sf9Data, setSf9Data] = useState<SF9Data | null>(null);
  const [studentIdData, setStudentIdData] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync role with user object
  useEffect(() => {
    if (user) {
      setRole(user.role === 'admin' || user.role === 'teacher' ? Role.TEACHER : Role.STUDENT);
    }
  }, [user]);

  // Handle auto-login for demo if no user
  useEffect(() => {
    const savedUser = localStorage.getItem('system2_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Auto-login as student for demo
      axios.post(`${API_BASE_URL}/login`, { email: 'juan.dc@snps.edu.ph', password: 'student123' })
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('system2_user', JSON.stringify(res.data.user));
        });
    }
  }, []);

  // Fetch data based on view and user
  useEffect(() => {
    if (!user) return;

    if (currentView === 'sf9' && user.studentId) {
      setIsLoading(true);
      axios.get(`${API_BASE_URL}/sf9/${user.studentId}`)
        .then(res => setSf9Data(res.data))
        .catch(err => console.error('Failed to fetch SF9:', err))
        .finally(() => setIsLoading(false));
    }

    if (currentView === 'id' && user.studentId) {
      setIsLoading(true);
      axios.get(`${API_BASE_URL}/student-id/${user.studentId}`)
        .then(res => setStudentIdData(res.data))
        .catch(err => console.error('Failed to fetch ID data:', err))
        .finally(() => setIsLoading(false));
    }
  }, [currentView, user]);

  const handleRoleSwitch = () => {
    const targetEmail = role === Role.STUDENT ? 'maria.santos@snps.edu.ph' : 'juan.dc@snps.edu.ph';
    const targetPassword = role === Role.STUDENT ? 'teacher123' : 'student123';
    
    setIsLoading(true);
    axios.post(`${API_BASE_URL}/login`, { email: targetEmail, password: targetPassword })
      .then(res => {
        setUser(res.data.user);
        localStorage.setItem('system2_user', JSON.stringify(res.data.user));
        setView(res.data.user.role === 'teacher' ? 'grading' : 'sf9');
      })
      .finally(() => setIsLoading(false));
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

    if (role === Role.STUDENT) {
        switch (currentView) {
            case 'sf9':
                return sf9Data ? <SF9ReportCard data={sf9Data} /> : <div className="p-8 text-center text-gray-500 font-medium">No academic records found for this student.</div>;
            case 'id':
                return studentIdData ? <IDGenerator student={studentIdData} /> : <div className="p-8 text-center text-gray-500 font-medium">Student profile not found.</div>;
            default:
                return null;
        }
    } else {
        switch (currentView) {
            case 'grading':
                return <GradingSheet />;
            case 'masterlist':
                return <Masterlist />;
            default:
                return null;
        }
    }
  };

  return (
    <Layout 
      role={role} 
      setRole={handleRoleSwitch} 
      currentView={currentView} 
      setView={setView}
      userName={user?.name}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;