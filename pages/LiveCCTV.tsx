
import React, { useState } from 'react';
import {
  Grid3X3,
  Columns2,
  LayoutGrid,
  Plus,
  Maximize2,
  Shield,
  Settings,
  Video,
  ChevronDown,
  Monitor,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
  Cpu,
  X,
  Camera as CameraIcon,
  CheckCircle2,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { CameraStatus } from '../types';
import { api } from '../api';

type GridLayout = '2x2' | '3x3' | '4x4';

interface LiveCCTVProps {
  cameras: CameraStatus[];
  onAddCamera: () => void; // Changed signature to just be a detailed 'refresh' signal
}

const LiveCCTV: React.FC<LiveCCTVProps> = ({ cameras, onAddCamera }) => {
  const [gridLayout, setGridLayout] = useState<GridLayout>('3x3');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocusView, setIsFocusView] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [showAIOverlays, setShowAIOverlays] = useState(true);

  // Registration State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newCamData, setNewCamData] = useState({
    name: '',
    id: '',
    area: 'Entrance',
    streamUrl: ''
  });
  const [isTestingStream, setIsTestingStream] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'fail'>('none');

  const areas = Array.from(new Set(cameras.map(c => c.area)));

  const getGridCols = () => {
    switch (gridLayout) {
      case '2x2': return 'grid-cols-2';
      case '3x3': return 'grid-cols-2 lg:grid-cols-3';
      case '4x4': return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      default: return 'grid-cols-3';
    }
  };

  const filteredCameras = cameras.filter(cam =>
    cam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cam.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFocus = (id: string) => {
    setSelectedCameraId(id);
    setIsFocusView(true);
  };

  const handleTestStream = async () => {
    if (!newCamData.streamUrl) return;
    setIsTestingStream(true);
    setTestResult('none');

    // Call Real Backend Test
    const success = await api.testCameraConnection(newCamData.streamUrl);

    setIsTestingStream(false);
    setTestResult(success ? 'success' : 'fail');
  };

  const handleRegisterCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamData.id || !newCamData.name || !newCamData.streamUrl) return;

    const newCam: CameraStatus = {
      id: newCamData.id,
      name: newCamData.name,
      status: 'online',
      lastSeen: new Date().toISOString(),
      detectionsToday: 0,
      area: newCamData.area
    };

    // Call Real Backend Register
    const success = await api.registerCamera(newCam, newCamData.streamUrl);

    if (success) {
      onAddCamera(); // Trigger refresh in parent
      setShowRegisterModal(false);
      setNewCamData({ name: '', id: '', area: 'Entrance', streamUrl: '' });
      setTestResult('none');
    } else {
      alert("Failed to register camera. Check backend logs.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Video className="text-blue-600" />
            Live Monitor Wall
          </h1>
          <p className="text-sm text-slate-500">Global site monitoring with active gait-analysis</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-[#d0d7de] rounded-md py-1.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
            />
          </div>

          <div className="flex items-center bg-white border border-[#d0d7de] rounded-md p-1 shadow-sm">
            {[
              { id: '2x2', icon: Columns2 },
              { id: '3x3', icon: Grid3X3 },
              { id: '4x4', icon: LayoutGrid }
            ].map(l => (
              <button
                key={l.id}
                onClick={() => setGridLayout(l.id as GridLayout)}
                className={`p-1.5 rounded transition-all flex items-center gap-1.5 text-xs font-bold ${gridLayout === l.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <l.icon size={14} />
                <span className="hidden sm:inline">{l.id}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAIOverlays(!showAIOverlays)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold shadow-sm border transition-all ${showAIOverlays ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            {showAIOverlays ? <Eye size={16} /> : <EyeOff size={16} />}
            AI Overlays
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <Plus size={16} />
            Register Camera
          </button>
        </div>
      </div>

      <div className="space-y-12 pb-20">
        {areas.map(area => {
          const areaCams = filteredCameras.filter(c => c.area === area);
          if (areaCams.length === 0 && searchTerm) return null;

          return (
            <section key={area} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">{area}</h2>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    {areaCams.length} Active Feeds
                  </span>
                </div>
                <button className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                  Area Config <ChevronDown size={14} />
                </button>
              </div>

              {areaCams.length > 0 ? (
                <div className={`grid gap-5 ${getGridCols()}`}>
                  {areaCams.map(cam => (
                    <div
                      key={cam.id}
                      className="gh-card overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer relative bg-slate-100 shadow-sm"
                      onClick={() => handleFocus(cam.id)}
                    >
                      <div className="aspect-video relative bg-slate-900 overflow-hidden">
                        <img
                          src={`https://picsum.photos/seed/${cam.id}/600/338`}
                          alt={cam.name}
                          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${cam.status === 'offline' ? 'opacity-30 grayscale' : 'opacity-70 group-hover:opacity-90'}`}
                        />

                        {showAIOverlays && cam.status === 'online' && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/4 left-1/2 w-16 h-32 border border-green-500/50 rounded-sm"></div>
                            <div className="absolute top-1/2 right-1/4 w-12 h-24 border border-blue-500/50 rounded-sm"></div>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded border border-white/20">
                          <div className={`w-2 h-2 rounded-full ${cam.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                          <span className="text-[10px] font-mono font-black text-white">{cam.id}</span>
                        </div>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <div className="p-3 bg-white rounded-full shadow-2xl hover:scale-110 transition-transform text-slate-800">
                            <Maximize2 size={20} />
                          </div>
                          <div className="p-3 bg-white rounded-full shadow-2xl hover:scale-110 transition-transform text-slate-800">
                            <Settings size={20} />
                          </div>
                        </div>

                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                          <p className="text-xs font-bold text-white truncate leading-tight tracking-wide">{cam.name}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-[9px] text-slate-400 font-medium">Last detection: {cam.status === 'online' ? 'Real-time' : cam.lastSeen}</p>
                            {cam.detectionsToday > 100 && cam.status === 'online' && (
                              <div className="bg-red-600 text-white text-[8px] font-black px-1 rounded animate-pulse">ACTIVE BUSY</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50">
                  <Monitor size={24} className="opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Monitoring Units</p>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Register Camera Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <CameraIcon size={20} />
                </div>
                <h3 className="font-bold text-slate-800">Register New Camera Unit</h3>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterCamera} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Device Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Hallway"
                    value={newCamData.name}
                    onChange={e => setNewCamData({ ...newCamData, name: e.target.value })}
                    className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Serial ID</label>
                  <input
                    type="text"
                    required
                    placeholder="CAM-XX"
                    value={newCamData.id}
                    onChange={e => setNewCamData({ ...newCamData, id: e.target.value })}
                    className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Monitoring Area</label>
                <select
                  value={newCamData.area}
                  onChange={e => setNewCamData({ ...newCamData, area: e.target.value })}
                  className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  <option value="New Area">+ Create New Area...</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Stream Endpoint (RTSP/HTTP)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="rtsp://internal-ip:554/stream"
                    value={newCamData.streamUrl}
                    onChange={e => setNewCamData({ ...newCamData, streamUrl: e.target.value })}
                    className="flex-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestStream}
                    disabled={isTestingStream || !newCamData.streamUrl}
                    className="px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isTestingStream ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Radio size={14} />}
                    Test
                  </button>
                </div>
              </div>

              {testResult === 'success' && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3 text-green-700 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 size={16} />
                  Stream verified successfully. Gait Analysis Engine ready.
                </div>
              )}
              {testResult === 'fail' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                  <AlertTriangle size={16} />
                  Stream unreachable. Check URL or Network.
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 bg-white border border-[#d0d7de] text-slate-600 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCamData.name || !newCamData.id || testResult !== 'success'}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Focus View Modal */}
      {isFocusView && selectedCameraId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)] flex flex-col max-h-[95vh] border border-white/20">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                  <Monitor size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 leading-none">
                    {cameras.find(c => c.id === selectedCameraId)?.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">{selectedCameraId}</span>
                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">ENCRYPTED STREAM</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                  <Cpu size={16} /> Gait v2.4.1
                </button>
                <button
                  onClick={() => setIsFocusView(false)}
                  className="p-2.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-all border border-transparent hover:border-slate-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden relative group">
              <img
                src={`https://picsum.photos/seed/${selectedCameraId}/1920/1080`}
                alt="Focus Feed"
                className="max-w-full max-h-full object-contain opacity-80"
              />

              {showAIOverlays && (
                <>
                  <div className="absolute top-1/3 left-1/3 w-24 h-48 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse rounded-sm">
                    <span className="absolute -top-7 left-0 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-sm shadow-lg">VERIFIED STAFF: JOHN DOE (99.4%)</span>
                  </div>
                  <div className="absolute top-1/2 right-1/3 w-20 h-40 border-2 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] rounded-sm">
                    <span className="absolute -top-7 left-0 bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded-sm shadow-lg">VISITOR MAPPED (86.1%)</span>
                  </div>
                </>
              )}

              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl text-white font-mono text-xs flex items-center gap-3 border border-white/10">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                  <span className="tracking-widest font-black uppercase">Live Intelligence Feed</span>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setShowAIOverlays(!showAIOverlays)} className="bg-white/10 backdrop-blur-md hover:bg-white/20 px-4 py-2 rounded-xl border border-white/20 text-white flex items-center gap-2 text-xs font-bold transition-all">
                  {showAIOverlays ? <Eye size={16} /> : <EyeOff size={16} />}
                  Toggle Skeleton Mapping
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-6 border-t border-slate-100">
              {[
                { label: 'Detections Today', val: cameras.find(c => c.id === selectedCameraId)?.detectionsToday, color: 'text-slate-800' },
                { label: 'Signal Quality', val: '98%', color: 'text-green-600' },
                { label: 'Analysis Latency', val: '42ms', color: 'text-blue-600' },
                { label: 'Alert Triggered', val: 'None', color: 'text-slate-400' }
              ].map(stat => (
                <div key={stat.label} className="gh-card p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCCTV;
