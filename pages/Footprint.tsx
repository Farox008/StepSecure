
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, ArrowUpRight, Map as MapIcon, ChevronDown } from 'lucide-react';
import { api } from '../api';
import { FootprintData } from '../types';

const PIE_DATA = [
  { name: 'Employees', value: 400, color: '#2563eb' },
  { name: 'Visitors', value: 300, color: '#8b5cf6' },
  { name: 'Unidentified', value: 100, color: '#f43f5e' },
];

const Footprint: React.FC = () => {
  const [footprintData, setFootprintData] = useState<FootprintData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Daily');
  const [showHeatmap, setShowHeatmap] = useState(false);

  const loadData = async () => {
    const data = await api.fetchFootprintData();
    setFootprintData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Update charts as simulator works
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Traffic & Footprint</h1>
          <p className="text-sm text-slate-500">Spatial distribution and visitor volume analysis</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#d0d7de] p-1 rounded-lg shadow-sm">
           {['Daily', 'Weekly', 'Monthly'].map(range => (
             <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               {range}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="gh-card p-6 md:col-span-2 shadow-sm relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-slate-700 flex items-center gap-2 text-sm uppercase tracking-widest">
                <TrendingUp size={18} className="text-blue-600" />
                Visitor Density ({timeRange})
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">Real-time telemetry stream active</p>
            </div>
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-black bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
              <ArrowUpRight size={14} />
              Live Tracking
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={footprintData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 4 }}
                  contentStyle={{ border: '1px solid #d0d7de', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40}>
                  {footprintData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1e40af' : '#2563eb'} fillOpacity={0.6 + (entry.count / 300)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
           <div className="gh-card p-6 shadow-sm">
              <h3 className="font-black text-slate-700 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
                <Users size={18} className="text-indigo-600" />
                Subject Composition
              </h3>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                   <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Total</p>
                   <p className="text-2xl font-black text-slate-800">800</p>
                </div>
              </div>
              <div className="space-y-3 mt-6">
                {PIE_DATA.map(item => (
                  <div key={item.name} className="flex justify-between items-center group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                    </div>
                    <span className="font-black text-slate-800 text-sm">{(item.value / 8).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
           </div>

           <button 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="w-full gh-card p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative overflow-hidden group border-none shadow-xl shadow-indigo-100"
            >
              <div className="relative z-10 flex flex-col items-start text-left">
                <MapIcon className="mb-4 text-indigo-200 group-hover:scale-110 transition-transform duration-300" size={36} />
                <h3 className="text-xl font-black mb-1 leading-none">Spatial Heatmap</h3>
                <p className="text-indigo-100 text-xs font-medium opacity-80 mb-6">Real-time floor density projection</p>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/20 text-xs font-bold group-hover:bg-white/20 transition-all">
                  Launch Visualizer
                  <ChevronDown size={14} className={showHeatmap ? 'rotate-180' : ''} />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>
           </button>
        </div>
      </div>
      
      {showHeatmap && (
        <div className="gh-card p-1 shadow-2xl animate-in slide-in-from-top-4 duration-500 overflow-hidden">
          <div className="bg-slate-900 aspect-[21/9] rounded-lg relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ 
               backgroundImage: 'radial-gradient(circle at 20% 30%, #4f46e5 0%, transparent 40%), radial-gradient(circle at 80% 60%, #ef4444 0%, transparent 40%)'
             }}></div>
             <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Floor plan visualizer loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Footprint;
