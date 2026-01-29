

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, ChevronLeft, ChevronRight, FileText, Download, CheckCircle, Search, Clock } from 'lucide-react';
import { api } from '../api';
import { RecognitionEvent } from '../types';

const Logs: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<RecognitionEvent[]>([]);

  useEffect(() => {
    api.fetchEvents().then(setEvents);
  }, []);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleMonthChange = (direction: number) => {
    let nextMonth = currentMonth + direction;
    let nextYear = currentYear;
    if (nextMonth > 11) { nextMonth = 0; nextYear++; }
    if (nextMonth < 0) { nextMonth = 11; nextYear--; }
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
    setSelectedDate(1);
  };

  const handleReportDownload = () => {
    alert(`Generating audit report for ${months[currentMonth]} ${selectedDate}, ${currentYear}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Historical Audit</h1>
          <p className="text-sm text-slate-500">Retrieving system logs and biometric identification events</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search audit trail..."
            className="w-full sm:w-64 bg-white border border-[#d0d7de] rounded-md py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="gh-card overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-[#d0d7de] flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{months[currentMonth]} {currentYear}</h3>
              <div className="flex gap-1">
                <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-7 gap-1 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 py-2">{d}</div>
              ))}
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`h-9 w-full flex items-center justify-center text-xs font-semibold rounded-md transition-all ${selectedDate === day
                      ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-100 ring-offset-1'
                      : 'hover:bg-slate-100 text-slate-600 active:scale-95'
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="gh-card p-5 bg-gradient-to-br from-white to-slate-50 shadow-sm">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
              <FileText size={14} className="text-blue-500" />
              Daily Activity
            </h4>
            <div className="space-y-4">
              {[
                { label: 'Identifications', val: String(events.length || '342'), color: 'text-slate-800' },
                { label: 'Security Alerts', val: String(events.filter(e => !e.isEmployee).length), color: 'text-red-600 font-black' },
                { label: 'System Uptime', val: '99.9%', color: 'text-green-600' },
                { label: 'Active Staff', val: '28', color: 'text-slate-800' }
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center group">
                  <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="gh-card shadow-sm h-full flex flex-col">
            <div className="p-4 border-b border-[#d0d7de] flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <CalendarIcon size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-700">Events for {months[currentMonth]} {selectedDate}, {currentYear}</h3>
              </div>
              <button
                onClick={handleReportDownload}
                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-all border border-transparent hover:border-blue-100"
              >
                <Download size={14} />
                Download Audit Trail
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {events.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">No events found for this period.</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="p-4 flex items-center justify-between hover:bg-slate-50 group transition-all">
                    <div className="flex items-center gap-6">
                      <div className="text-slate-400 font-mono text-xs w-20 flex items-center gap-2">
                        <Clock size={12} />
                        {event.timestamp?.split('T')?.[1]?.split('.')[0] || event.timestamp}
                      </div>
                      <div className={`h-2.5 w-2.5 rounded-full ${event.isEmployee ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse'}`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">{event.label}</p>
                          {event.isEmployee && <CheckCircle size={12} className="text-blue-500" />}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight mt-0.5">
                          Unit: {event.cameraId} • Gait Match: {(event.confidence * 100).toFixed(0)}% Accuracy
                        </p>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-all bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 px-4 py-1.5 text-[10px] font-black rounded-lg shadow-sm active:scale-95 uppercase tracking-widest">
                      Replay Frame
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-[#d0d7de] flex justify-center">
              <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Load More Historical Events</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
