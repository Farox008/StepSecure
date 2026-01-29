
import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Clock, BarChart3, UserPlus, X, Upload, CheckCircle2, Search, Video, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import { Employee, CameraStatus } from '../types';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  // Registration State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [regData, setRegData] = useState({
    name: '',
    age: '',
    occupation: '',
    type: 'Full-Time',
    allowed_areas: [] as string[]
  });
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Verify State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [empData, camData] = await Promise.all([
      api.fetchEmployees(),
      api.fetchCameras()
    ]);
    setEmployees(empData);

    // Extract unique areas from cameras as "allowable areas"
    const areas = Array.from(new Set(camData.map(c => c.area).filter(Boolean)));
    // Default areas if none defined
    setAvailableAreas(areas.length > 0 ? areas : ['General', 'Lab', 'Server Room', 'Lobby']);

    setIsLoading(false);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterSubmit = async () => {
    setIsRegistering(true);
    const formData = new FormData();
    formData.append('name', regData.name);
    formData.append('age', regData.age);
    formData.append('occupation', regData.occupation);
    formData.append('type', regData.type);
    formData.append('allowed_areas', JSON.stringify(regData.allowed_areas));

    videoFiles.forEach((file) => {
      formData.append('videos', file);
    });

    const success = await api.registerEmployee(formData);
    setIsRegistering(false);

    if (success) {
      setRegisterStep(3); // Success Step
      loadData(); // Refresh list
    } else {
      alert("Registration failed. Please check backend logs.");
    }
  };

  const handleVerify = async () => {
    if (!verifyFile) return;
    setIsVerifying(true);
    setVerifyResult(null);
    const result = await api.verifyGaitVideo(verifyFile);
    setVerifyResult(result);
    setIsVerifying(false);
  };

  // --- Render Helpers ---

  const ToggleArea = (area: string) => {
    setRegData(prev => {
      const current = prev.allowed_areas;
      if (current.includes(area)) return { ...prev, allowed_areas: current.filter(a => a !== area) };
      return { ...prev, allowed_areas: [...current, area] };
    });
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
            onClick={() => setShowVerifyModal(true)}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 shadow-sm transition-all whitespace-nowrap"
          >
            <ShieldCheck size={18} />
            Verify Gait
          </button>

          <button
            onClick={() => { setShowRegisterModal(true); setRegisterStep(1); setRegData({ name: '', age: '', occupation: '', type: 'Full-Time', allowed_areas: [] }); setVideoFiles([]); }}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-all whitespace-nowrap"
          >
            <UserPlus size={18} />
            Register Gait
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="gh-card overflow-hidden group hover:shadow-md transition-shadow relative">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg transform group-hover:scale-105 transition-transform">
                  {(employee.name || 'Unknown').split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{employee.name || 'Unknown'}</h3>
                  <div className="text-xs text-slate-500 mb-1">{employee.occupation || 'Employee'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${employee.lastDetected && employee.lastDetected !== 'Never' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    <p className="text-xs text-slate-500 font-medium">
                      {employee.lastDetected && employee.lastDetected !== 'Never' && employee.lastDetected.includes('T')
                        ? `Last seen: ${employee.lastDetected.split('T')[1]?.split('.')[0]}`
                        : (employee.lastDetected || 'Not seen yet')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/50">
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Type</p>
                <p className="text-sm font-bold text-slate-800">{employee.employee_type || 'Full-Time'}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Age</p>
                <p className="text-sm font-bold text-slate-800">{employee.age || 'N/A'}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Access</p>
                <p className="text-sm font-bold text-blue-600">{employee.allowed_areas ? employee.allowed_areas.length : 0} Areas</p>
              </div>
            </div>

            <div className="p-4 bg-white">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Confidence Trend</h4>
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(employee.confidenceTrend || []).map((v, i) => ({ val: v }))}>
                    <Area type="monotone" dataKey="val" stroke="#2563eb" fill="#eff6ff" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VERIFY MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShieldCheck size={20} className="text-purple-600" /> Verify Identity via Gait</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {!verifyResult ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Upload a video snippet (min 5s) to verify if the person is a registered employee.</p>
                  <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 hover:bg-purple-50 transition-colors bg-slate-50 text-center relative group">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none">
                      <Video size={32} className="mx-auto text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium text-slate-600">{verifyFile ? verifyFile.name : "Click to Upload Video"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-6 rounded-xl border ${verifyResult.status === 'KNOWN' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} text-center space-y-3`}>
                  <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${verifyResult.status === 'KNOWN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {verifyResult.status === 'KNOWN' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">{verifyResult.person_name}</h4>
                    <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">{verifyResult.status} PERSON</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono mt-4">
                    <div className="bg-white/50 p-2 rounded">
                      <span className="block text-slate-400">Confidence</span>
                      <strong className="text-slate-700">{verifyResult.confidence}</strong>
                    </div>
                    <div className="bg-white/50 p-2 rounded">
                      <span className="block text-slate-400">Process Time</span>
                      <strong className="text-slate-700">{verifyResult.processing_time}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                {verifyResult && (
                  <button onClick={() => { setVerifyResult(null); setVerifyFile(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md">
                    Verify Another
                  </button>
                )}
                {!verifyResult && (
                  <button
                    disabled={!verifyFile || isVerifying}
                    onClick={handleVerify}
                    className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing Biometrics...
                      </>
                    ) : "Verify Identity"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800">Biometric Registration</h3>
                <p className="text-xs text-slate-500">Step {registerStep} of 3</p>
              </div>
              {!isRegistering && <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>}
            </div>

            <div className="p-8 overflow-y-auto">
              {registerStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Full Name</label>
                      <input type="text" className="w-full border p-2 rounded" value={regData.name} onChange={e => setRegData({ ...regData, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Age</label>
                      <input type="number" className="w-full border p-2 rounded" value={regData.age} onChange={e => setRegData({ ...regData, age: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Occupation</label>
                      <input type="text" className="w-full border p-2 rounded" value={regData.occupation} onChange={e => setRegData({ ...regData, occupation: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Employee Type</label>
                      <select className="w-full border p-2 rounded" value={regData.type} onChange={e => setRegData({ ...regData, type: e.target.value })}>
                        <option>Full-Time</option>
                        <option>Part-Time</option>
                        <option>Contractor</option>
                        <option>Visitor</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-500">Allowed Areas (Access Control)</label>
                    <div className="flex flex-wrap gap-2">
                      {availableAreas.map(area => (
                        <button
                          key={area}
                          onClick={() => ToggleArea(area)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${regData.allowed_areas.includes(area) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {registerStep === 2 && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <Upload size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">Upload Training Data</h4>
                    <p className="text-sm text-slate-500 mt-1">Please upload at least 10 video clips (10-15s each) of the subject walking from different angles.</p>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-blue-400 transition-colors bg-slate-50 relative">
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={(e) => setVideoFiles(Array.from(e.target.files || []))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none">
                      <p className="text-sm font-medium text-slate-700">{videoFiles.length > 0 ? `${videoFiles.length} files selected` : "Drop files here or click to browse"}</p>
                      {videoFiles.length > 0 && <p className="text-xs text-slate-400 mt-2">Ready to train</p>}
                    </div>
                  </div>

                  {videoFiles.length < 5 && videoFiles.length > 0 && (
                    <div className="flex items-center gap-2 justify-center text-amber-600 text-xs font-medium bg-amber-50 p-2 rounded">
                      <AlertTriangle size={14} />
                      Recommended: 10+ videos for accurate recognition.
                    </div>
                  )}
                </div>
              )}

              {registerStep === 3 && (
                <div className="space-y-6 text-center py-4">
                  <div className="mx-auto w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">Registration Complete</h4>
                    <p className="text-sm text-slate-500 mt-1">{regData.name} has been added to the database. The ML model is training in the background.</p>
                  </div>
                  <button
                    onClick={() => { setShowRegisterModal(false); loadData(); }}
                    className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-slate-900 transition-all shadow-lg"
                  >
                    Close & Finish
                  </button>
                </div>
              )}
            </div>

            {registerStep < 3 && (
              <div className="p-4 border-t border-slate-100 flex justify-between bg-slate-50">
                {registerStep > 1 && (
                  <button onClick={() => setRegisterStep(s => s - 1)} className="text-slate-500 font-medium text-sm hover:text-slate-800">Back</button>
                )}
                <div className="flex-1"></div>
                {registerStep === 1 && (
                  <button
                    disabled={!regData.name || !regData.age}
                    onClick={() => setRegisterStep(2)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next Step
                  </button>
                )}
                {registerStep === 2 && (
                  <button
                    disabled={videoFiles.length === 0 || isRegistering}
                    onClick={handleRegisterSubmit}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Training Model...
                      </>
                    ) : "Complete Registration"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
