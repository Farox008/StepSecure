import React, { useState, useEffect } from 'react';
import { Ic } from '../Icons';
import { C, FONT } from '../../constants/theme';
import { fetchEvents } from '../../data/mockData';

export default function FeedPanel() {
    const [activeDay, setActiveDay] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const year = new Date().getFullYear();

    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
    const allDays = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, currentMonth, i + 1);
        return {
            l: d.toLocaleDateString('en-US', { weekday: 'short' }),
            n: (i + 1).toString().padStart(2, '0')
        };
    });

    // Auto-select today
    useEffect(() => {
        const today = new Date().getDate().toString().padStart(2, '0');
        setActiveDay(today);
    }, [currentMonth]);

    useEffect(() => {
        setLoading(true);
        fetchEvents(50)
            .then(data => { setEvents(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    let activeIdx = allDays.findIndex(d => d.n === activeDay);
    if (activeIdx === -1) activeIdx = 0;
    let startIdx = activeIdx - 3;
    if (startIdx < 0) startIdx = 0;
    if (startIdx + 7 > allDays.length) startIdx = Math.max(0, allDays.length - 7);
    const visibleDays = expanded ? allDays : allDays.slice(startIdx, startIdx + 7);

    // Filter events to show today's or selected day's events
    const todayEventDate = activeDay ? parseInt(activeDay, 10) : null;
    const filteredEvents = events.filter(ev => {
        if (!todayEventDate) return true;
        const d = parseInt(ev.date, 10);
        return d === todayEventDate;
    });

    return (
        <div style={{ width: 258, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, background: "white", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: C.text, fontFamily: FONT }}>Feed</span>
                <div style={{ display: "flex", gap: 8, color: "#888", alignItems: "center" }}>
                    <button onClick={() => setExpanded(!expanded)} title={expanded ? "Show Week" : "Show Month"} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", color: "inherit", padding: 2 }}>
                        {expanded ? <Ic.ChevronUp /> : <Ic.ChevronDown />}
                    </button>
                    <Ic.Filter />
                    <Ic.Grid />
                </div>
            </div>

            {/* Calendar */}
            <div style={{ padding: "10px 8px 10px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, padding: "0 6px" }}>
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "white", fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FONT, cursor: "pointer" }}>
                            {MONTHS[currentMonth]} {year}
                            <div style={{ display: "flex", color: "#888" }}><Ic.ChevronDown /></div>
                        </button>
                        {showMonthDropdown && (
                            <>
                                <div onClick={() => setShowMonthDropdown(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }} />
                                <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "white", border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "0 10px 25px rgba(0,0,0,0.05)", zIndex: 10, maxHeight: 220, overflowY: "auto", minWidth: 140, padding: 4 }}>
                                    {MONTHS.map((m, i) => (
                                        <div key={i} onClick={() => { setCurrentMonth(i); setShowMonthDropdown(false); }}
                                            style={{ padding: "8px 12px", fontSize: 12, fontWeight: currentMonth === i ? 700 : 500, color: currentMonth === i ? "#111" : "#555", fontFamily: FONT, cursor: "pointer", borderRadius: 4, background: currentMonth === i ? "#f4f4f5" : "transparent" }}
                                            onMouseEnter={e => { if (currentMonth !== i) e.currentTarget.style.background = "#f8f8f8"; }}
                                            onMouseLeave={e => { if (currentMonth !== i) e.currentTarget.style.background = "transparent"; }}>
                                            {m} {year}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ display: expanded ? "grid" : "flex", gridTemplateColumns: expanded ? "repeat(7, 1fr)" : "unset", gap: expanded ? "8px 0" : 0 }}>
                    {visibleDays.map(d => (
                        <button key={d.n} onClick={() => setActiveDay(d.n)} style={{ flex: expanded ? "unset" : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: "none", background: "transparent", cursor: "pointer", padding: "3px 0" }}>
                            <span style={{ fontSize: 8, color: activeDay === d.n ? "#111" : "#bbb", fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", fontFamily: FONT }}>{d.l}</span>
                            <span style={{ width: 24, height: 24, borderRadius: "50%", background: activeDay === d.n ? "#111" : "transparent", color: activeDay === d.n ? "white" : "#666", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: activeDay === d.n ? 700 : 400, transition: "all 0.15s", fontFamily: FONT }}>{d.n}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px" }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ddd", flexShrink: 0 }} />
                            <div style={{ width: 48, height: 34, borderRadius: 6, background: "#f0f0f0", flexShrink: 0, animation: "shimmer 1.4s infinite" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ height: 10, background: "#f0f0f0", borderRadius: 4, marginBottom: 5, animation: "shimmer 1.4s infinite" }} />
                                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, width: "70%", animation: "shimmer 1.4s infinite" }} />
                            </div>
                        </div>
                    ))
                ) : filteredEvents.length === 0 ? (
                    <div style={{ padding: "30px 20px", textAlign: "center", color: C.light }}>
                        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT }}>No feed activity.</div>
                        <div style={{ fontSize: 11, fontFamily: FONT, marginTop: 4 }}>All clear for this day.</div>
                    </div>
                ) : (
                    filteredEvents.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", cursor: "pointer", transition: "background 0.12s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8f8f8"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ddd", flexShrink: 0 }} />
                            <div style={{ width: 48, height: 34, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                                <img src={item.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: FONT }}>{item.cam}</div>
                                <div style={{ fontSize: 10, color: C.muted, marginTop: 1, fontFamily: FONT }}>{item.type}</div>
                                <div style={{ fontSize: 9, color: C.light, marginTop: 1, fontFamily: FONT }}>{item.time}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
