import React, { useState, useEffect } from 'react';
import { Ic } from '../components/Icons';
import { C, FONT } from '../constants/theme';
import { fetchEvents, markEventRead } from '../data/mockData';

export default function ActivityPage() {
    const [alerts, setAlerts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetchEvents(50)
            .then(data => {
                setAlerts(data);
                if (data.length > 0) setSelected(data[0]);
                setLoading(false);
            })
            .catch(err => { setError(err.message); setLoading(false); });
    }, []);

    const types = ["All", "Person Detected", "PIR Alarm", "Motion Detected"];
    const filtered = filter === "All" ? alerts : alerts.filter(a => a.type === filter);

    const severityColor = { high: C.red, medium: C.orange, low: C.blue };
    const severityBg = { high: C.redBg, medium: C.orangeBg, low: C.blueBg };

    const handleSelect = async (alert) => {
        setSelected(alert);
        if (alert.status === 'unread') {
            await markEventRead(alert.id).catch(() => { });
            setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'read' } : a));
        }
    };

    return (
        <>
            {/* Top bar */}
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "white" }}>
                <div>
                    <h1 style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: FONT }}>Activity Log</h1>
                    <p style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 2 }}>
                        {loading ? "Loading…" : `${alerts.length} events · Live from Supabase`}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {types.map(t => (
                        <button key={t} onClick={() => setFilter(t)} style={{ padding: "4px 11px", borderRadius: 20, border: `1px solid ${filter === t ? "#111" : C.border2}`, background: filter === t ? "#111" : "white", color: filter === t ? "white" : C.muted, fontSize: 11, fontFamily: FONT, cursor: "pointer", transition: "all 0.15s" }}>{t}</button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden", background: C.bg }}>
                {/* Alert list */}
                <div style={{ width: 340, borderRight: `1px solid ${C.border}`, overflowY: "auto", background: "white", flexShrink: 0 }}>
                    {error && (
                        <div style={{ padding: "12px 14px", color: "#dc2626", fontSize: 11, fontFamily: FONT }}>⚠️ {error}</div>
                    )}
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
                                <div style={{ width: 56, height: 42, borderRadius: 7, background: "#f0f0f0", flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ height: 10, background: "#f0f0f0", borderRadius: 4, marginBottom: 6, width: "70%" }} />
                                    <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, width: "50%" }} />
                                </div>
                            </div>
                        ))
                    ) : (
                        filtered.map((alert) => (
                            <div key={alert.id} onClick={() => handleSelect(alert)}
                                style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: selected?.id === alert.id ? "#f8f8f8" : "white", transition: "background 0.12s", display: "flex", gap: 10, alignItems: "flex-start" }}
                                onMouseEnter={e => { if (selected?.id !== alert.id) e.currentTarget.style.background = "#fafafa" }}
                                onMouseLeave={e => { if (selected?.id !== alert.id) e.currentTarget.style.background = "white" }}>
                                {/* Thumb */}
                                <div style={{ width: 56, height: 42, borderRadius: 7, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                                    <img src={alert.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    {alert.status === "unread" && <div style={{ position: "absolute", top: 3, right: 3, width: 7, height: 7, borderRadius: "50%", background: C.red, border: "1.5px solid white" }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: C.text, fontFamily: FONT }}>{alert.type}</span>
                                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: severityBg[alert.severity], color: severityColor[alert.severity], fontWeight: 600, fontFamily: FONT, textTransform: "uppercase" }}>{alert.severity}</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: C.muted, fontFamily: FONT, marginBottom: 2 }}>{alert.cam}</div>
                                    <div style={{ fontSize: 9, color: C.light, fontFamily: FONT }}>{alert.date} · {alert.time}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail panel */}
                {selected && (
                    <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                        {/* Event snapshot */}
                        <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, aspectRatio: "16/7", position: "relative" }}>
                            <img src={selected.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
                            <div style={{ position: "absolute", bottom: 14, left: 16, color: "white" }}>
                                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: FONT }}>{selected.type}</div>
                                <div style={{ fontSize: 11, opacity: 0.85, fontFamily: FONT }}>{selected.cam} · {selected.date} at {selected.time}</div>
                            </div>
                            <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                                <span style={{ color: "white", fontSize: 10, fontWeight: 600, fontFamily: FONT }}>RECORDED</span>
                            </div>
                        </div>

                        {/* Person info card */}
                        {selected.person ? (
                            <div style={{ background: "white", borderRadius: 12, padding: 18, marginBottom: 14, border: `1px solid ${C.border}` }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: FONT, marginBottom: 14 }}>Person Identified</div>
                                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                    <div style={{ position: "relative" }}>
                                        <img src={selected.person.img} alt={selected.person.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `3px solid ${selected.person.role.includes("Unknown") || selected.person.role.includes("Not") ? C.red : C.green}` }} />
                                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: "50%", background: selected.person.role.includes("Unknown") || selected.person.role.includes("Not") ? C.red : C.green, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                            {selected.person.role.includes("Unknown") || selected.person.role.includes("Not") ? <Ic.X /> : <Ic.Check />}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: FONT }}>{selected.person.name}</div>
                                        <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT, marginTop: 2 }}>{selected.person.role}</div>
                                        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 9, color: C.light, fontFamily: FONT, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Match Confidence</div>
                                                <div style={{ height: 6, background: "#f0f0f0", borderRadius: 10, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: `${selected.person.confidence}%`, background: selected.person.confidence > 90 ? C.green : selected.person.confidence > 75 ? C.orange : C.red, borderRadius: 10, transition: "width 0.5s ease" }} />
                                                </div>
                                                <div style={{ fontSize: 10, color: C.text, fontWeight: 700, fontFamily: FONT, marginTop: 3 }}>{selected.person.confidence}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: C.light }}><Ic.Users /></div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: FONT }}>No person detected</div>
                                    <div style={{ fontSize: 11, color: C.light, fontFamily: FONT }}>Motion or sensor triggered this alert</div>
                                </div>
                            </div>
                        )}

                        {/* Meta info grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                                { label: "Camera", value: selected.cam },
                                { label: "Alert Type", value: selected.type },
                                { label: "Date", value: selected.date },
                                { label: "Time", value: selected.time },
                                { label: "Severity", value: selected.severity.toUpperCase() },
                                { label: "Status", value: selected.status === "unread" ? "New" : "Reviewed" },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ background: "white", borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.border}` }}>
                                    <div style={{ fontSize: 9, color: C.light, fontFamily: FONT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: FONT }}>{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
