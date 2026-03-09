import React, { useState, useEffect } from 'react';
import { ListFilter, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { fetchEvents } from '../../data/mockData';

// Static week strip — could be made dynamic later
const DAYS = [
    { day: 'Thu', date: '09' },
    { day: 'Fri', date: '10' },
    { day: 'Sat', date: '11' },
    { day: 'Sun', date: '12' },
    { day: 'Mon', date: '13' },
    { day: 'Tue', date: '14' },
    { day: 'Wed', date: '15', active: true },
];

export default function FeedPanel() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents(20)
            .then(data => { setEvents(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="w-[300px] bg-white border-l border-gray-100 flex flex-col shrink-0">
            {/* Header */}
            <div className="px-6 pt-8 pb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Feed</h2>
                <div className="flex gap-3 text-gray-500">
                    <button className="hover:text-black transition-colors"><ListFilter className="w-5 h-5" /></button>
                    <button className="hover:text-black transition-colors"><SlidersHorizontal className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Date Strip */}
            <div className="px-5 pb-6 border-b border-gray-50">
                <div className="flex justify-between">
                    {DAYS.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-gray-400 font-medium uppercase">{d.day}</span>
                            <div className={clsx(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors cursor-pointer",
                                d.active ? "bg-black text-white shadow-md shadow-black/20" : "text-gray-700 hover:bg-gray-100"
                            )}>
                                {d.date}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 relative">
                {/* Timeline line */}
                <div className="absolute left-[34px] top-6 bottom-6 w-px bg-gray-100 -z-10"></div>

                {loading ? (
                    /* Loading skeletons */
                    [...Array(5)].map((_, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="ml-4 w-20 h-12 rounded-lg bg-gray-100 shrink-0 animate-pulse" />
                            <div className="flex flex-col flex-1 gap-1.5">
                                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                            </div>
                        </div>
                    ))
                ) : (
                    events.map((evt, idx) => (
                        <div key={idx} className="flex items-center gap-4 group cursor-pointer relative">
                            <div className="w-1.5 h-1.5 rounded-full bg-black ring-4 ring-white absolute -left-1 shrink-0"></div>
                            <div className="ml-4 w-20 h-12 rounded-lg overflow-hidden relative shadow-sm ring-1 ring-gray-200 shrink-0">
                                <img src={evt.thumb} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-black transition-colors">{evt.cam}</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">{evt.type}</p>
                                <p className="text-[10px] text-gray-400">{evt.time}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
