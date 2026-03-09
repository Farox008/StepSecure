import React, { useState, useEffect } from 'react';
import { Ic } from '../components/Icons';
import { C, FONT } from '../constants/theme';
import { TABS, fetchCamerasGrouped } from '../data/mockData';
import VideoStream from '../components/VideoStream';

function CameraCard({ cam }) {
    const [hov, setHov] = useState(false);
    const isStreaming = !!cam.hls_url;

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                borderRadius: 12, overflow: "hidden", position: "relative",
                aspectRatio: "16/10", cursor: "pointer",
                transform: hov ? "scale(1.015)" : "scale(1)",
                boxShadow: hov ? "0 10px 32px rgba(0,0,0,0.22)" : "0 2px 10px rgba(0,0,0,0.09)",
                transition: "transform 0.2s, box-shadow 0.2s",
                background: "#111",
            }}
        >
            {/* Live video or fallback thumbnail */}
            <VideoStream
                hlsUrl={cam.hls_url}
                thumbnail={cam.img}
                camName={cam.name}
                status={cam.status}
            />

            {/* Top-left: wifi + battery icons */}
            <div style={{ position: "absolute", top: 8, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Ic.Wifi />
                    <Ic.Battery />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ background: "rgba(0,0,0,0.5)", color: "white", fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 20, backdropFilter: "blur(4px)", fontFamily: FONT }}>
                        {cam.signal}
                    </span>
                    <Ic.Dots />
                </div>
            </div>

            {/* Top-centre: LIVE / OFFLINE / NO STREAM badge */}
            <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.45)", padding: "2px 8px", borderRadius: 20, backdropFilter: "blur(4px)", pointerEvents: "none" }}>
                <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: cam.status === 'online' ? "#22c55e" : "#ef4444",
                    boxShadow: cam.status === 'online' ? "0 0 5px #22c55e" : "none",
                }} />
                <span style={{ color: "white", fontSize: 9, fontWeight: 600, letterSpacing: 1, fontFamily: FONT }}>
                    {cam.status !== 'online' ? 'OFFLINE' : isStreaming ? 'LIVE' : 'NO STREAM'}
                </span>
            </div>

            {/* Bottom gradient overlay */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)", pointerEvents: "none" }} />

            {/* Bottom-left: camera name + date/time */}
            <div style={{ position: "absolute", bottom: 10, left: 12, color: "white", pointerEvents: "none" }}>
                <div style={{ fontWeight: 600, fontSize: 12, fontFamily: FONT }}>{cam.name}</div>
                {cam.rtsp_url ? (
                    <div style={{ opacity: 0.7, fontSize: 9, fontFamily: FONT, letterSpacing: 0.3 }}>
                        {cam.rtsp_url.replace(/:[^:@]*@/, ':***@')}
                    </div>
                ) : (
                    <div style={{ opacity: 0.7, fontSize: 10, fontFamily: FONT }}>{cam.date} · {cam.time}</div>
                )}
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div style={{ borderRadius: 12, aspectRatio: "16/10", background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
    );
}

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("All");
    const [gridCols, setGridCols] = useState(2);
    const [camerasGrouped, setCamerasGrouped] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetchCamerasGrouped()
            .then(data => { setCamerasGrouped(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, []);

    const visibleSections = activeTab === "All"
        ? Object.entries(camerasGrouped)
        : Object.entries(camerasGrouped).filter(([k]) => k === activeTab);

    return (
        <>
            {/* Tab & grid controls */}
            <div style={{ padding: "10px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "white", overflowX: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "5px 13px", borderRadius: 20, border: "none", background: activeTab === tab ? "#111" : "transparent", color: activeTab === tab ? "white" : "#666", fontSize: 12, fontWeight: activeTab === tab ? 600 : 400, cursor: "pointer", transition: "all 0.15s", fontFamily: FONT, whiteSpace: "nowrap" }}>
                            {tab}
                        </button>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginRight: 2 }}>Grid:</span>
                    {[2, 3, 4, 5].map(cols => (
                        <button key={cols} onClick={() => setGridCols(cols)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${gridCols === cols ? "#111" : C.border2}`, background: gridCols === cols ? "#111" : "white", color: gridCols === cols ? "white" : C.muted, fontSize: 11, fontWeight: 600, fontFamily: FONT, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {cols}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main camera grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px", background: C.bg }}>
                {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#dc2626", fontSize: 12, fontFamily: FONT }}>
                        ⚠️ Failed to load cameras: {error}
                    </div>
                )}

                {loading ? (
                    <>
                        {["Zone A", "Zone B"].map(loc => (
                            <div key={loc} style={{ marginBottom: 28 }}>
                                <div style={{ width: 90, height: 18, background: "#e8e8e8", borderRadius: 5, marginBottom: 12 }} />
                                <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: 12 }}>
                                    {[1, 2].map(i => <SkeletonCard key={i} />)}
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    visibleSections.length === 0 ? (
                        /* Empty state — no cameras added yet */
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 14, color: C.light }}>
                            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                            </svg>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: FONT }}>No cameras found</div>
                                <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT, marginTop: 4 }}>Go to Devices → Add Device to add your first camera</div>
                            </div>
                        </div>
                    ) : (
                        visibleSections.map(([title, cameras]) => (
                            <div key={title} style={{ marginBottom: 28 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12, fontFamily: FONT }}>{title}</h2>
                                <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: 12 }}>
                                    {cameras.map(cam => <CameraCard key={cam.id} cam={cam} />)}
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </>
    );
}
