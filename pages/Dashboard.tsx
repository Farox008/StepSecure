

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Users,
  Activity,
  Clock,
  ShieldAlert,
  ArrowRight,
  Monitor,
  LayoutGrid,
  Grid3X3,
  Columns2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { CameraStatus, RecognitionEvent } from '../types';
import { api } from '../api';

const trendData = [
  { time: '08:00', detections: 12 },
  { time: '10:00', detections: 45 },
  { time: '12:00', detections: 88 },
  { time: '14:00', detections: 72 },
  { time: '16:00', detections: 95 },
  { time: '18:00', detections: 120 },
  { time: '20:00', detections: 54 },
];

type GridLayout = '2x2' | '3x3' | '4x4';

interface DashboardProps {
  cameras: CameraStatus[];
}

const Dashboard: React.FC<DashboardProps> = ({ cameras }) => {
  const [gridLayout, setGridLayout] = useState<GridLayout>('4x4');
  const [recentEvents, setRecentEvents] = useState<RecognitionEvent[]>([]);

  useEffect(() => {
    // Fetch real recent events
    api.fetchEvents().then(events => {
      setRecentEvents(events.slice(0, 5));
    });
  }, []);

  const getGridCols = () => {
    switch (gridLayout) {
      case '2x2': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
      case '3x3': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case '4x4': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operational Overview</h1>
          <p className="text-sm text-slate-500">Real-time gait monitoring & site security status</p>
        </div>
        <div className="text-sm text-slate-500 bg-white border border-[#d0d7de] px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
          <Clock size={14} />
          System sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Top Level Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gh-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
              <Camera size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Active Units</span>
          </div>
          <p className="text-3xl font-bold">{cameras.filter(c => c.status === 'online').length} / {cameras.length}</p>
          <p className="text-xs text-green-600 mt-2 font-medium">92% Operational Uptime</p>
        </div>

        <div className="gh-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-md">
              <Users size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Staff On-Site</span>
          </div>
          <p className="text-3xl font-bold">28</p>
          <p className="text-xs text-slate-500 mt-2">Gait profiles verified</p>
        </div>

        <div className="gh-card p-5 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-md">
              <ShieldAlert size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Active Alerts</span>
          </div>
          <p className="text-3xl font-bold text-red-600">3</p>
          <p className="text-xs text-red-500 mt-2 font-bold animate-pulse uppercase tracking-wider">Requires Attention</p>
        </div>

        <div className="gh-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
              <Activity size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Recognition Score</span>
          </div>
          <p className="text-3xl font-bold">96.8%</p>
          <p className="text-xs text-green-600 mt-2">↑ 0.4% from avg</p>
        </div>
      </div>

      {/* Camera Grid Section */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Monitor size={20} className="text-blue-600" />
            Live Camera Grid
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white border border-[#d0d7de] rounded-md p-1 shadow-sm">
              <button
                onClick={() => setGridLayout('2x2')}
                className={`p-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium ${gridLayout === '2x2' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                title="2x2 Layout"
              >
                <Columns2 size={14} />
                <span className="hidden sm:inline">2x2</span>
              </button>
              <button
                onClick={() => setGridLayout('3x3')}
                className={`p-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium ${gridLayout === '3x3' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                title="3x3 Layout"
              >
                <Grid3X3 size={14} />
                <span className="hidden sm:inline">3x3</span>
              </button>
              <button
                onClick={() => setGridLayout('4x4')}
                className={`p-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium ${gridLayout === '4x4' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                title="4x4 Layout"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">4x4</span>
              </button>
            </div>
            <Link to="/live" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              Expanded Monitor <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className={`grid gap-4 transition-all duration-300 ${getGridCols()}`}>
          {cameras.map((cam) => (
            <div key={cam.id} className="gh-card overflow-hidden group hover:border-blue-400 transition-colors shadow-sm">
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/${cam.id}/400/225`}
                  alt={cam.name}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${cam.status === 'offline' ? 'grayscale opacity-50' : 'opacity-80'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-white/10">
                  <div className={`w-1.5 h-1.5 rounded-full ${cam.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                  <span className="text-[10px] font-mono font-bold text-white uppercase">{cam.status}</span>
                </div>
                <div className="absolute bottom-2 left-2 text-white">
                  <p className="text-xs font-bold leading-tight">{cam.id}</p>
                  <p className="text-[10px] opacity-80">{cam.name}</p>
                </div>
                {cam.status === 'online' && (
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">LIVE</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity size={12} />
                  <span className="text-[11px] font-medium">{cam.detectionsToday} detections today</span>
                </div>
                <Link to="/live" className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors">
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection Trend */}
        <div className="lg:col-span-2 gh-card p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            Detection Activity Trend
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #d0d7de', borderRadius: '6px' }}
                />
                <Area type="monotone" dataKey="detections" stroke="#2563eb" fillOpacity={1} fill="url(#colorDetections)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Alert Feed */}
        <div className="gh-card flex flex-col">
          <div className="p-4 border-b border-[#d0d7de] flex items-center justify-between">
            <h3 className="font-semibold">Recent Alerts</h3>
            <span className="bg-red-100 text-red-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Live</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {recentEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No recent alerts</div>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="p-4 border-b border-[#f1f5f9] hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${event.isEmployee ? 'text-green-600' : 'text-red-600'}`}>
                      {event.isEmployee ? 'Employee' : 'Intruder'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{event.timestamp?.split('T')?.[1] || event.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-slate-800">{event.label}</p>
                    <span className="text-xs text-slate-400">• Conf: {(event.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{event.cameraId}</p>
                </div>
              ))
            )}
          </div>
          <Link to="/alerts" className="p-3 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
            View All Logs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
