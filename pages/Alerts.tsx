
import React, { useState, useEffect } from 'react';
import { Filter, Download, Search, AlertTriangle, CheckCircle, MoreVertical, X, CheckSquare, Eye } from 'lucide-react';
import { api } from '../api';
import { RecognitionEvent } from '../types';

const Alerts: React.FC = () => {
  const [events, setEvents] = useState<RecognitionEvent[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await api.fetchEvents();
      setEvents(data);
      setIsLoading(false);
    };
    loadData();

    // Poll for new alerts
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesFilter = filter === 'all' || (filter === 'intruder' ? !e.isEmployee : e.isEmployee);
    const matchesSearch = e.label.toLowerCase().includes(searchTerm.toLowerCase()) || e.cameraId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Status,Subject,Confidence,Camera,Timestamp\n"
      + filteredEvents.map(e => `${e.isEmployee ? 'Verified' : 'Alert'},${e.label},${(e.confidence*100).toFixed(2)}%,${e.cameraId},${e.timestamp}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `StepSecure_Alerts_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReview = (event: any) => {
    setSelectedAlert(event);
    setShowReviewModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Security Alerts</h1>
          <p className="text-sm text-slate-500">Managing identification logs across site network</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-[#d0d7de] px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="gh-card overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-[#d0d7de] bg-slate-50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex items-center gap-2">
             {['all', 'intruder', 'employee'].map((type) => (
               <button 
                  key={type}
                  onClick={() => { setFilter(type); setCurrentPage(1); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all capitalize ${filter === type ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-[#d0d7de] text-slate-600 hover:border-slate-400'}`}
               >
                  {type === 'all' ? 'All Events' : type + 's'}
               </button>
             ))}
          </div>
          <div className="relative">
             <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
               <Search size={14} />
             </span>
             <input 
               type="text" 
               placeholder="Search logs..." 
               value={searchTerm}
               onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
               className="bg-white border border-[#d0d7de] rounded-md py-1.5 pl-9 pr-4 text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
             <div className="p-20 text-center text-slate-400 text-sm animate-pulse uppercase font-black">Syncing with Site DB...</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#d0d7de] text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Camera ID</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${event.isEmployee ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                        <span className={`text-[10px] font-bold uppercase ${event.isEmployee ? 'text-green-600' : 'text-red-600'}`}>
                          {event.isEmployee ? 'Verified' : 'Alert'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 text-sm">{event.label}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${event.confidence > 0.95 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                            style={{ width: `${event.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{(event.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600 uppercase">{event.cameraId}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{event.timestamp}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleReview(event)} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-all">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">No security events found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="p-4 bg-[#f6f8fa] border-t border-[#d0d7de] flex items-center justify-between">
           <p className="text-xs text-slate-500 font-medium">Auto-refreshing every 5s</p>
           <div className="flex gap-2">
             <button disabled className="px-3 py-1 border border-[#d0d7de] rounded text-xs bg-white opacity-50 font-medium">Previous</button>
             <button disabled className="px-3 py-1 border border-[#d0d7de] rounded text-xs bg-white opacity-50 font-medium">Next</button>
           </div>
        </div>
      </div>

      {showReviewModal && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                Alert Review: {selectedAlert.id}
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <img src={`https://picsum.photos/seed/${selectedAlert.id}/800/450`} alt="Review" className="w-full h-full object-cover opacity-70" />
                {!selectedAlert.isEmployee && <div className="absolute inset-0 border-2 border-red-500 m-8 animate-pulse"></div>}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Subject Label</p>
                  <p className="font-semibold text-slate-700">{selectedAlert.label}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Confidence</p>
                  <p className="font-semibold text-slate-700">{(selectedAlert.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowReviewModal(false)} className="flex-1 bg-blue-600 text-white py-2 rounded-md font-bold text-sm">Close Case</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
