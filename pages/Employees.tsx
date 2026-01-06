
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Clock, BarChart3, UserPlus, X, Upload, CheckCircle2, Search } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../api';
import { Employee } from '../types';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await api.fetchEmployees();
      setEmployees(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetModal = () => {
    setShowRegisterModal(false);
    setRegisterStep(1);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hydrating Staff Profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff Profiles</h1>
          <p className="text-sm text-slate-500">Managing {employees.length} registered biometric gait profiles</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-white border border-[#d0d7de] rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-all whitespace-nowrap"
          >
            <UserPlus size={18} />
            Register Gait
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="gh-card overflow-hidden group hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg transform group-hover:scale-105 transition-transform">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{employee.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-xs text-slate-500 font-medium">Last active today at {employee.lastDetected.split(' ')[1]}</p>
                  </div>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/50">
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Hrs Today</p>
                <p className="text-lg font-bold text-slate-800">8.5h</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Attendance</p>
                <p className="text-lg font-bold text-slate-800">{employee.daysPresent}d</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Conf. Index</p>
                <p className="text-lg font-bold text-blue-600">{(employee.confidenceTrend.reduce((a, b) => a + b, 0) / employee.confidenceTrend.length * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">
                  <BarChart3 size={12} className="text-blue-500" />
                  Recognition Consistency
                </h4>
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={employee.confidenceTrend.map((v, i) => ({ day: i, val: v }))}>
                      <defs>
                        <linearGradient id={`grad-${employee.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="val" stroke="#2563eb" fill={`url(#grad-${employee.id})`} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">
                  <Clock size={12} className="text-indigo-500" />
                  Recent Timeline
                </h4>
                <div className="space-y-2">
                  {employee.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-100 text-xs hover:border-blue-200 transition-colors cursor-default">
                      <span className="font-semibold text-slate-700">{activity.action}</span>
                      <span className="text-slate-400 font-mono font-bold">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Biometric Registration</h3>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="p-8">
              {registerStep === 1 ? (
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <Upload size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">Upload Reference Video</h4>
                    <p className="text-sm text-slate-500 mt-1">Upload a 10s clip of the employee walking for initial gait signature generation.</p>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-blue-400 transition-colors cursor-pointer bg-slate-50">
                    <p className="text-xs text-slate-400 font-medium">Drop MP4/MOV here or click to browse</p>
                  </div>
                  <button 
                    onClick={() => setRegisterStep(2)}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Continue to Mapping
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-center py-4">
                  <div className="mx-auto w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">Gait Profile Verified</h4>
                    <p className="text-sm text-slate-500 mt-1">Gait signature mapped with 98.4% precision. Profile is now active across all CCTV units.</p>
                  </div>
                  <button 
                    onClick={resetModal}
                    className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-slate-900 transition-all shadow-lg"
                  >
                    Close & Finish
                  </button>
                </div>
              )}
            </div>
            
            <div className="px-8 pb-8 flex justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${registerStep === 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              <div className={`w-2 h-2 rounded-full ${registerStep === 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
