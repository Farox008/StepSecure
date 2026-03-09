import React, { useState, useEffect } from 'react';
import { Ic } from '../components/Icons';
import { C, FONT } from '../constants/theme';
import { fetchCameras, insertCamera, deleteCamera } from '../data/mockData';


// Sanitize IP into a mediamtx stream name
function ipToStreamName(ip) {
    return 'cam_' + ip.replace(/\./g, '_');
}


export default function DevicesPage() {
    const [view, setView] = useState("list");
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Simplified form — just the essentials
    const [form, setForm] = useState({
        ip: "", port: "554", user: "admin", pass: "",
        name: "", location: "",
    });

    // Discovery state
    const [discovering, setDiscovering] = useState(false);
    const [discovered, setDiscovered] = useState([]); // [{pattern, rtspUrl, hlsUrl, status: 'checking'|'ok'|'fail'}]
    const [selectedIdx, setSelectedIdx] = useState(null);

    const typeColors = { "IP Camera": C.blue, "PTZ Camera": C.orange, "NVR": "#8b5cf6" };
    const typeBg = { "IP Camera": C.blueBg, "PTZ Camera": C.orangeBg, "NVR": "#f5f3ff" };

    const loadDevices = () => {
        setLoading(true);
        fetchCameras()
            .then(data => {
                setDevices(data.map(d => ({
                    id: d.id,
                    name: d.name,
                    type: 'IP Camera',
                    location: d.location,
                    ip: d.ip_address || '—',
                    status: d.status,
                    signal: d.signal_strength,
                    brand: d.brand || '',
                    model: d.model || '',
                    rtsp_url: d.rtsp_url || null,
                    hls_url: d.hls_url || null,
                    stream_name: d.stream_name || null,
                })));
                setLoading(false);
            })
            .catch(err => { setError(err.message); setLoading(false); });
    };

    useEffect(() => { loadDevices(); }, []);

    // ── Discover: call backend API which probes RTSP via mediamtx ────────────
    const handleDiscover = async () => {
        const { ip, port, user, pass } = form;
        if (!ip) return;

        setDiscovering(true);
        setSelectedIdx(null);

        // Show placeholder loading list immediately
        setDiscovered(Array(12).fill(null).map((_, i) => ({ label: `Pattern ${i + 1}`, status: 'checking' })));

        try {
            const res = await fetch('/api/discover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip, port, user, pass }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Server error');
            }

            const results = await res.json();
            setDiscovered(results);

            // Auto-select first live stream, else first result
            const firstOk = results.findIndex(r => r.status === 'ok');
            setSelectedIdx(firstOk !== -1 ? firstOk : 0);

            // Auto-fill device name from IP if empty
            if (!form.name) {
                setForm(prev => ({ ...prev, name: `Camera ${ip.split('.').pop()}` }));
            }
        } catch (err) {
            setError(`Discovery failed: ${err.message}. Make sure the backend server is running (npm run dev).`);
            setDiscovered([]);
        } finally {
            setDiscovering(false);
        }
    };


    // ── Save selected stream ──────────────────────────────────────────────────
    const handleAddDevice = async () => {
        const { ip, port, user, pass, name, location } = form;
        if (!name || !ip) return;

        const sel = selectedIdx !== null ? discovered[selectedIdx] : null;
        const streamName = sel?.pathName || (ipToStreamName(ip) + '_0');
        const rtspUrl = sel?.rtspUrl || `rtsp://${user}:${pass}@${ip}:${port}/stream1`;
        const hlsUrl = sel?.hlsUrl || `http://localhost:8889/${streamName}/index.m3u8`;

        setSaving(true);
        try {
            // 1. Tell mediamtx backend to add this stream
            await fetch('/api/streams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: streamName, rtspUrl }),
            });

            // 2. Persist to Supabase
            await insertCamera({
                name,
                location,
                ip,
                brand: sel?.brand || '',
                model: '',
                rtsp_url: rtspUrl,
                stream_name: streamName,
                hls_url: hlsUrl,
            });

            setView('list');
            setForm({ ip: '', port: '554', user: 'admin', pass: '', name: '', location: '' });
            setDiscovered([]); setSelectedIdx(null);
            loadDevices();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };


    const inputStyle = {
        width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.border2}`,
        fontSize: 13, fontFamily: FONT, outline: "none", color: C.text, boxSizing: "border-box", background: "white",
        transition: "border-color 0.15s",
    };
    const labelStyle = {
        display: "block", fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: FONT,
        textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5,
    };

    return (
        <>
            {/* ── Header ── */}
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "white" }}>
                <div>
                    <h1 style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: FONT }}>Devices</h1>
                    <p style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 2 }}>
                        {loading ? "Loading…" : `${devices.filter(d => d.status === "online").length} online · ${devices.filter(d => d.status === "offline").length} offline`}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {[{ id: "list", label: "All Devices" }, { id: "add", label: "+ Add Device" }].map(({ id, label }) => (
                        <button key={id} onClick={() => { setView(id); setDiscovered([]); setSelectedIdx(null); }}
                            style={{ padding: "7px 16px", borderRadius: 9, border: `1px solid ${view === id ? "#111" : C.border2}`, background: view === id ? "#111" : "white", color: view === id ? "white" : C.muted, fontSize: 12, fontFamily: FONT, cursor: "pointer", fontWeight: view === id ? 600 : 400, transition: "all 0.15s" }}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20, background: C.bg }}>
                {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 14, color: "#dc2626", fontSize: 11, fontFamily: FONT }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* ── DEVICE LIST ── */}
                {view === "list" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} style={{ background: "white", borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, display: "flex", gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0f0f0", flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ height: 12, background: "#f0f0f0", borderRadius: 4, width: "40%", marginBottom: 6 }} />
                                        <div style={{ height: 10, background: "#f0f0f0", borderRadius: 4, width: "60%" }} />
                                    </div>
                                </div>
                            ))
                        ) : devices.length === 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12, color: C.light }}>
                                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                                </svg>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT }}>No cameras yet</div>
                                    <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 4 }}>Click "+ Add Device" to connect your first camera</div>
                                </div>
                                <button onClick={() => setView("add")} style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: "#111", color: "white", fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer", marginTop: 4 }}>
                                    + Add Device
                                </button>
                            </div>
                        ) : (
                            devices.map(d => (
                                <div key={d.id} style={{ background: "white", borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: typeBg[d.type] || C.blueBg, display: "flex", alignItems: "center", justifyContent: "center", color: typeColors[d.type] || C.blue, flexShrink: 0 }}>
                                        <Ic.Camera />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT }}>{d.name}</span>
                                            {d.rtsp_url && (
                                                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: "#f0fdf4", color: "#16a34a", fontWeight: 600, fontFamily: FONT, display: "flex", alignItems: "center", gap: 3 }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />RTSP
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 2 }}>{d.location} · {d.ip}</div>
                                        {d.rtsp_url && (
                                            <div style={{ fontSize: 9, color: C.light, fontFamily: "monospace", marginTop: 2 }}>
                                                {d.rtsp_url.replace(/:[^:@]*@/, ':***@')}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: d.status === "online" ? C.greenBg : C.redBg }}>
                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: d.status === "online" ? C.green : C.red }} />
                                        <span style={{ fontSize: 10, color: d.status === "online" ? C.green : C.red, fontWeight: 600, fontFamily: FONT, textTransform: "uppercase" }}>{d.status}</span>
                                    </div>
                                    <button onClick={() => deleteCamera(d.id).then(() => setDevices(p => p.filter(x => x.id !== d.id)))}
                                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border2}`, background: "white", color: C.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Ic.Trash />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── ADD DEVICE ── */}
                {view === "add" && (
                    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* ① Camera credentials */}
                        <div style={{ background: "white", borderRadius: 14, padding: 24, border: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 18 }}>Camera Credentials</div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={labelStyle}>IP Address *</label>
                                    <input value={form.ip} onChange={e => setForm(p => ({ ...p, ip: e.target.value }))} placeholder="192.168.1.100"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = "#111"}
                                        onBlur={e => e.target.style.borderColor = C.border2} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Port (RTSP)</label>
                                    <input value={form.port} onChange={e => setForm(p => ({ ...p, port: e.target.value }))} placeholder="554"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = "#111"}
                                        onBlur={e => e.target.style.borderColor = C.border2} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                                <div>
                                    <label style={labelStyle}>Username</label>
                                    <input value={form.user} onChange={e => setForm(p => ({ ...p, user: e.target.value }))} placeholder="admin"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = "#111"}
                                        onBlur={e => e.target.style.borderColor = C.border2} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Password</label>
                                    <input type="password" value={form.pass} onChange={e => setForm(p => ({ ...p, pass: e.target.value }))} placeholder="••••••••"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = "#111"}
                                        onBlur={e => e.target.style.borderColor = C.border2} />
                                </div>
                            </div>

                            {/* Test & Discover button */}
                            <button
                                onClick={handleDiscover}
                                disabled={!form.ip || discovering}
                                style={{
                                    width: "100%", padding: "11px", borderRadius: 9, border: "none",
                                    background: !form.ip ? "#f0f0f0" : "linear-gradient(135deg, #111, #333)",
                                    color: !form.ip ? C.light : "white",
                                    fontSize: 13, fontWeight: 700, fontFamily: FONT,
                                    cursor: !form.ip ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    transition: "opacity 0.2s",
                                    boxShadow: form.ip ? "0 4px 14px rgba(0,0,0,0.15)" : "none",
                                }}
                            >
                                {discovering ? (
                                    <>
                                        <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                        Scanning RTSP streams…
                                    </>
                                ) : (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                        </svg>
                                        Test & Discover Streams
                                    </>
                                )}
                            </button>

                            {/* Hint */}
                            <div style={{ marginTop: 10, fontSize: 10, color: C.light, fontFamily: FONT, textAlign: "center", lineHeight: 1.6 }}>
                                Tries 12 common RTSP URL formats — green = live stream detected (requires <strong>mediamtx</strong> running). Select any format to save.
                            </div>
                        </div>

                        {/* ② Discovered streams */}
                        {discovered.length > 0 && (
                            <div style={{ background: "white", borderRadius: 14, padding: 24, border: `1px solid ${C.border}` }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT }}>Stream Discovery Results</div>
                                    <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT }}>
                                        {discovered.filter(d => d.status === 'ok').length} live · {discovered.filter(d => d.status === 'fail').length} not detected
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {discovered.map((r, i) => (
                                        <div key={i} onClick={() => setSelectedIdx(i)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                                                borderRadius: 10, cursor: "pointer",
                                                border: selectedIdx === i ? "1.5px solid #111" : `1px solid ${C.border}`,
                                                background: selectedIdx === i ? "#fafafa" : "white",
                                                transition: "all 0.12s",
                                            }}>

                                            {/* Selection radio */}
                                            <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${selectedIdx === i ? "#111" : C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                {selectedIdx === i && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#111" }} />}
                                            </div>

                                            {/* Status dot */}
                                            {r.status === 'checking' ? (
                                                <span style={{ width: 10, height: 10, border: "2px solid #ddd", borderTopColor: "#999", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0, display: "inline-block" }} />
                                            ) : (
                                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: r.status === 'ok' ? '#22c55e' : '#e5e7eb', flexShrink: 0, boxShadow: r.status === 'ok' ? '0 0 6px #22c55e88' : 'none' }} />
                                            )}

                                            {/* Labels */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: FONT }}>{r.label}</span>
                                                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: r.status === 'ok' ? "#f0fdf4" : "#f9fafb", color: r.status === 'ok' ? "#16a34a" : C.light, fontWeight: 600, fontFamily: FONT }}>
                                                        {r.status === 'checking' ? 'Testing…' : r.status === 'ok' ? '● Live' : 'Not detected'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {r.rtspUrl ? r.rtspUrl.replace(/:[^:@]*@/, ':***@') : '—'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ③ Camera details — always visible so user can skip discovery */}
                        <div style={{ background: "white", borderRadius: 14, padding: 24, border: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 16 }}>Camera Details</div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                                <div>
                                    <label style={labelStyle}>Camera Name *</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={`Camera ${form.ip.split('.').pop() || '1'}`}
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = "#111"}
                                        onBlur={e => e.target.style.borderColor = C.border2} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Location / Zone</label>
                                    <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Front Door, Lobby"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = "#111"}
                                        onBlur={e => e.target.style.borderColor = C.border2} />
                                </div>
                            </div>

                            {/* Selected RTSP URL preview */}
                            {selectedIdx !== null && discovered[selectedIdx] && (
                                <div style={{ background: "#f9fafb", borderRadius: 9, padding: "12px 14px", marginBottom: 18, border: `1px solid ${C.border}` }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: FONT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Selected Stream</div>
                                    <div style={{ fontSize: 11, color: C.text, fontFamily: "monospace", marginBottom: 4, wordBreak: "break-all" }}>
                                        {(discovered[selectedIdx]?.rtspUrl || '').replace(/:[^:@]*@/, ':***@') || '—'}
                                    </div>
                                    <div style={{ fontSize: 10, color: C.green, fontFamily: "monospace" }}>
                                        HLS: {discovered[selectedIdx]?.hlsUrl || '—'}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleAddDevice}
                                disabled={!form.name || !form.ip || saving}
                                style={{
                                    width: "100%", padding: "11px", borderRadius: 9, border: "none",
                                    background: (!form.name || !form.ip) ? "#f0f0f0" : "#111",
                                    color: (!form.name || !form.ip) ? C.light : "white",
                                    fontSize: 13, fontWeight: 700, fontFamily: FONT,
                                    cursor: (!form.name || !form.ip) ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                }}>
                                {saving ? (
                                    <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Saving…</>
                                ) : "Add Camera to Dashboard"}
                            </button>
                        </div>

                        {/* mediamtx note */}
                        <div style={{ background: "white", borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, lineHeight: 1.7 }}>
                                <strong style={{ color: C.text }}>Live stream detection requires mediamtx running.</strong><br />
                                Download <a href="https://github.com/bluenviron/mediamtx/releases/latest" target="_blank" style={{ color: "#111", fontWeight: 700 }}>mediamtx.exe</a> → place alongside <code style={{ background: "#f5f5f5", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>mediamtx.yml</code> → run <code style={{ background: "#f5f5f5", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>.\mediamtx.exe</code>. Without it, all streams will show "Not detected" but you can still select any format and save.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
