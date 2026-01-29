
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Calendar, 
  ShieldCheck,
  Heart,
  Server,
  BrainCircuit,
  Activity
} from 'lucide-react';
import { api } from '../api';
import { SystemHealth } from '../types';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Video, label: 'Live CCTV', path: '/live' },
  { icon: AlertTriangle, label: 'Alerts', path: '/alerts' },
  { icon: Users, label: 'Employees', path: '/employees' },
  { icon: TrendingUp, label: 'Customer Footprint', path: '/footprint' },
  { icon: Calendar, label: 'Logs & Events', path: '/logs' },
];

const Sidebar: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const status = await api.fetchSystemHealth();
      setHealth(status);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-[#f6f8fa] border-r border-[#d0d7de] flex flex-col">
      <div className="p-6 flex items-center gap-2 mb-4">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">StepSecure</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-white border border-[#d0d7de] text-blue-600 shadow-sm' 
                  : 'text-slate-600 hover:bg-[#ebedef]'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 space-y-4">
        <div className="bg-white border border-[#d0d7de] p-4 rounded-xl shadow-sm space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">System Status</p>
          
          <div className="space-y-2.5">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                <Server size={14} className="text-blue-500" />
                <span className="text-xs font-semibold">Site API</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-green-600 uppercase">Online</span>
                <div className={`w-1.5 h-1.5 rounded-full ${health?.api === 'healthy' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                <BrainCircuit size={14} className="text-indigo-500" />
                <span className="text-xs font-semibold">ML Model</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-blue-600 uppercase">Ready</span>
                <div className={`w-1.5 h-1.5 rounded-full ${health?.mlModel === 'ready' ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)] animate-pulse' : 'bg-slate-300'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold">Analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-emerald-600 uppercase">Active</span>
                <div className={`w-1.5 h-1.5 rounded-full ${health?.analysis === 'active' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#d0d7de] flex flex-col items-center gap-1">
           <div className="flex items-center gap-1.5">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Built with</span>
             <Heart size={10} className="text-red-500 fill-red-500" />
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">by Farox</span>
           </div>
           <p className="text-[8px] text-slate-400 font-mono">Kernel v{health?.version || '...'}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
