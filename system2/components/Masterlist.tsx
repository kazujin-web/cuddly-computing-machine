import React, { useState, useEffect } from 'react';
import { mockClassRecord } from '../services/mockData';
import { Download, Share2, Search, Filter, Trash2, Edit } from 'lucide-react';
import axios from 'axios';

const Masterlist: React.FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/masterlist')
            .then(res => setStudents(res.data))
            .catch(err => console.error('Failed to fetch masterlist:', err))
            .finally(() => setIsLoading(false));
    }, []);

    const filteredStudents = students.filter(s => 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.lrn || '').includes(searchTerm)
    );

    const handleExportGoogleSheets = async () => {
        try {
            const response = await axios.post('/api/sync-grades', {
                spreadsheetId: '1ynlb3Qc7IarBP9bHDwSmHCdd4zFwuHPRE_Y4ujDeY0M', // Your provided Sheet ID
                range: 'Masterlist!A1',
                data: [
                    ['LRN', 'Name', 'Sex', 'Age', 'Section'],
                    ...filteredStudents.map(s => [s.lrn, s.name, s.id === 'stu2' ? 'F' : 'M', 11, s.section])
                ]
            });
            alert('Exported to Google Sheets successfully!');
        } catch (error: any) {
            console.error('Export failed:', error);
            alert('Export failed: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Masterlist Management</h2>
                    <p className="text-gray-500 text-sm">Manage student list for Grade 5 - Rizal</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExportGoogleSheets}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm font-medium">
                        <Share2 size={18} />
                        Sync to Google Sheets
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md text-sm font-medium">
                        <Download size={18} />
                        Export Excel
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or LRN..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                    <Filter size={18} />
                    Filter
                </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">No.</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">LRN</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Sex</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Age</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredStudents.map((student, index) => (
                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.lrn}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-semibold uppercase">{student.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${student.id === 'stu2' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {student.id === 'stu2' ? 'FEMALE' : 'MALE'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">10</td>
                                <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                    <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
                <p>Showing {filteredStudents.length} of {students.length} students</p>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
                    <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
                </div>
            </div>
        </div>
    );
};

export default Masterlist;