
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { User } from '../types';
import { LogOut, Bell, Search, User as UserIcon, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Intruder detected in Warehouse', type: 'alert', time: '2m ago' },
    { id: 2, text: 'John Doe verified at Main Entrance', type: 'info', time: '5m ago' },
    { id: 3, text: 'System update: Gait Engine v2.4.1', type: 'success', time: '1h ago' },
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f8fa]">
        <header className="h-16 bg-white border-b border-[#d0d7de] flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Quick search (Shift+K)..."
                className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-md transition-colors relative ${showNotifications ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#d0d7de] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-slate-50 border-b border-[#d0d7de] flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase">Notifications</span>
                    <button onClick={() => setNotifications([])} className="text-[10px] text-blue-600 hover:underline">Clear all</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3">
                        <div className={`mt-1 ${n.type === 'alert' ? 'text-red-500' : n.type === 'info' ? 'text-blue-500' : 'text-green-500'}`}>
                          {n.type === 'alert' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-800">{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400 italic text-xs">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                <UserIcon size={18} />
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
