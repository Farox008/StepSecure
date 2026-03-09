import React, { useState, useEffect, useRef } from 'react';
import { Ic } from '../components/Icons';
import { C, FONT } from '../constants/theme';
import { fetchPersons, insertPerson, deletePerson, updatePerson } from '../data/mockData';

const MODEL_API = '/api/model'; // proxied by Vite → http://localhost:8001

// ── Video thumbnail extractor ─────────────────────────────────────────────────
function extractVideoThumbnail(file) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        video.src = url;
        video.muted = true;
        video.currentTime = 0.5;
        video.addEventListener('seeked', () => {
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 180;
            canvas.getContext('2d').drawImage(video, 0, 0);
            resolve({ thumb: canvas.toDataURL('image/jpeg', 0.75), url });
        }, { once: true });
        video.addEventListener('error', () => resolve({ thumb: null, url }), { once: true });
        video.load();
    });
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border2}`,
    fontSize: 13, fontFamily: FONT, outline: 'none', color: C.text,
    background: 'white', transition: 'border-color 0.15s', boxSizing: 'border-box',
};
const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700, color: C.muted,
    fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
};
const Spinner = ({ size = 14, light }) => (
    <span style={{
        display: 'inline-block', width: size, height: size, flexShrink: 0,
        border: `2px solid ${light ? 'rgba(255,255,255,0.3)' : C.border2}`,
        borderTopColor: light ? 'white' : '#111', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
    }} />
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const [view, setView] = useState('list');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Registration state
    const [form, setForm] = useState({ name: '', role: 'Staff', access: 'All Areas', email: '' });
    const [videoFiles, setVideoFiles] = useState([]); // [{file, thumb, url, status, errorMsg}]
    const [saving, setSaving] = useState(false);
    const [enrollResult, setEnrollResult] = useState(null);
    const videoInputRef = useRef();

    // Test state
    const [testFile, setTestFile] = useState(null);
    const [testThumb, setTestThumb] = useState(null);
    const [testRunning, setTestRunning] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const testInputRef = useRef();

    const loadUsers = () => {
        setLoading(true);
        fetchPersons()
            .then(d => { setUsers(d); setLoading(false); })
            .catch(e => { setError(e.message); setLoading(false); });
    };
    useEffect(() => { loadUsers(); }, []);

    // ── Add videos ────────────────────────────────────────────────────────────
    const addVideos = async (files) => {
        const newFiles = Array.from(files).filter(f => f.type.startsWith('video/'));
        if (!newFiles.length) return;
        const entries = await Promise.all(newFiles.map(async f => ({
            file: f, status: 'pending',
            ...(await extractVideoThumbnail(f)),
        })));
        setVideoFiles(prev => [...prev, ...entries]);
    };
    const removeVideo = (i) => setVideoFiles(prev => prev.filter((_, j) => j !== i));

    // ── Register person ───────────────────────────────────────────────────────
    const handleRegister = async () => {
        if (!form.name || videoFiles.length === 0) return;
        setSaving(true);
        setError(null);
        setEnrollResult(null);

        try {
            setVideoFiles(prev => prev.map(v => ({ ...v, status: 'uploading' })));

            // 1. Save person to DB to get an ID (initially empty video array)
            const person = await insertPerson({ ...form, video_urls: [] });

            // 2. Send videos directly to local model server
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('person_id', person.id);
            videoFiles.forEach(v => fd.append('videos', v.file));

            let modelResult = null;
            try {
                const res = await fetch(`${MODEL_API}/register`, { method: 'POST', body: fd });
                if (res.ok) {
                    modelResult = await res.json();
                } else {
                    const e = await res.json().catch(() => null);
                    throw new Error(e?.detail || `Model sever error ${res.status}`);
                }
            } catch (err) {
                // If model fails, cleanup the database record
                await deletePerson(person.id);
                throw new Error(`Failed to process video: ${err.message}`);
            }

            // 3. Mark successful in Supabase so UI shows it as "enrolled"
            await updatePerson(person.id, { video_urls: ['enrolled_in_model'] });

            // Success
            setVideoFiles(prev => prev.map(v => ({ ...v, status: 'done' })));
            setEnrollResult(modelResult);

            setTimeout(() => {
                setForm({ name: '', role: 'Staff', access: 'All Areas', email: '' });
                setVideoFiles([]); setEnrollResult(null); setView('list'); loadUsers();
            }, 3000);
        } catch (e) {
            setError(e.message);
            setVideoFiles(prev => prev.map(v => ({ ...v, status: 'error', errorMsg: e.message })));
        } finally {
            setSaving(false);
        }
    };

    // ── Test ──────────────────────────────────────────────────────────────────
    const handleTestFile = async (file) => {
        if (!file) return;
        setTestFile(file);
        setTestResult(null);
        const { thumb } = await extractVideoThumbnail(file);
        setTestThumb(thumb);
    };

    const runTest = async () => {
        if (!testFile) return;
        setTestRunning(true);
        setTestResult(null);
        try {
            const fd = new FormData();
            fd.append('video', testFile);
            const res = await fetch(`${MODEL_API}/test`, { method: 'POST', body: fd });
            if (!res.ok) {
                const e = await res.json().catch(() => null);
                throw new Error(e?.detail || `Server error ${res.status}`);
            }
            const report = await res.json();
            setTestResult({ type: 'report', ...report });
        } catch (e) {
            setTestResult({ type: 'offline', message: e.message });
        } finally {
            setTestRunning(false);
        }
    };

    const enrolled = users.filter(u => u.video_urls?.length > 0);

    return (
        <>
            {/* ── Header ── */}
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'white' }}>
                <div>
                    <h1 style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: FONT }}>User Management</h1>
                    <p style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 2 }}>
                        {loading ? 'Loading…' : `${users.length} registered · ${enrolled.length} with videos`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[{ id: 'list', label: 'All Users' }, { id: 'register', label: '+ Register' }, { id: 'test', label: '⚡ Test' }].map(({ id, label }) => (
                        <button key={id} onClick={() => { setView(id); setTestResult(null); }}
                            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${view === id ? '#111' : C.border2}`, background: view === id ? '#111' : 'white', color: view === id ? 'white' : C.muted, fontSize: 12, fontFamily: FONT, cursor: 'pointer', fontWeight: view === id ? 600 : 400, transition: 'all 0.15s' }}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: C.bg }}>
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 11, fontFamily: FONT }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* ── USER LIST ── */}
                {view === 'list' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, display: 'flex', gap: 14 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}><div style={{ height: 12, background: '#f0f0f0', borderRadius: 4, width: '40%', marginBottom: 6 }} /><div style={{ height: 10, background: '#f0f0f0', borderRadius: 4, width: '60%' }} /></div>
                                </div>
                            ))
                        ) : users.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12, color: C.light }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT }}>No users registered</div>
                                    <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 4 }}>Click "+ Register" to add your first person</div>
                                </div>
                            </div>
                        ) : (
                            users.map(user => (
                                <div key={user.id} style={{ background: 'white', borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.light }}>
                                        {user.img
                                            ? <img src={user.img} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                                        }
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT }}>{user.name}</span>
                                            {user.video_urls?.length > 0 && (
                                                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: '#f0f9ff', color: '#0284c7', fontWeight: 600, fontFamily: FONT }}>
                                                    {user.video_urls.length} video{user.video_urls.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 2 }}>{user.role} · {user.access}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: C.greenBg }}>
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
                                        <span style={{ fontSize: 10, color: C.green, fontWeight: 600, fontFamily: FONT }}>Active</span>
                                    </div>
                                    <button onClick={() => deletePerson(user.id).then(() => setUsers(p => p.filter(u => u.id !== user.id)))}
                                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border2}`, background: 'white', color: C.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ic.Trash />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── REGISTER ── */}
                {view === 'register' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>

                        {/* Left: personal info */}
                        <div style={{ background: 'white', borderRadius: 14, padding: 22, border: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 18 }}>Personal Information</div>

                            {[{ label: 'Full Name *', key: 'name', placeholder: 'e.g. John Smith' }, { label: 'Email', key: 'email', placeholder: 'john@example.com' }].map(({ label, key, placeholder }) => (
                                <div key={key} style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>{label}</label>
                                    <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#111'}
                                        onBlur={e => e.target.style.borderColor = C.border2} />
                                </div>
                            ))}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                {[
                                    { label: 'Role', key: 'role', opts: ['Staff', 'Family', 'Visitor', 'Contractor'] },
                                    { label: 'Access Level', key: 'access', opts: ['All Areas', 'Front Only', 'Restricted', 'Full Access'] },
                                ].map(({ label, key, opts }) => (
                                    <div key={key}>
                                        <label style={labelStyle}>{label}</label>
                                        <select value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                            style={{ ...inputStyle, cursor: 'pointer' }}>
                                            {opts.map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* Enroll result */}
                            {enrollResult && (
                                <div style={{ background: '#f0fdf4', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: FONT }}>✓ Enrolled successfully</div>
                                    <div style={{ fontSize: 10, color: C.muted, fontFamily: FONT, marginTop: 4 }}>
                                        Quality score: <strong>{Math.round((enrollResult.quality_score || 0) * 100)}%</strong> · {enrollResult.frames_used || 0} frames used
                                    </div>
                                </div>
                            )}
                            {saving && !enrollResult && (
                                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 11, color: C.muted, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Spinner size={12} /> Uploading videos &amp; extracting embeddings…
                                </div>
                            )}

                            <button onClick={handleRegister} disabled={!form.name || videoFiles.length === 0 || saving}
                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: (!form.name || videoFiles.length === 0) ? '#f0f0f0' : '#111', color: (!form.name || videoFiles.length === 0) ? C.light : 'white', fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: (!form.name || videoFiles.length === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
                                {saving ? <><Spinner light />Registering…</> : 'Register Person'}
                            </button>
                            {videoFiles.length === 0 && form.name && (
                                <div style={{ marginTop: 8, fontSize: 10, color: C.muted, fontFamily: FONT, textAlign: 'center' }}>Add at least 1 video to register</div>
                            )}
                        </div>

                        {/* Right: video upload */}
                        <div style={{ background: 'white', borderRadius: 14, padding: 22, border: `1px solid ${C.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT }}>Registration Videos</div>
                                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: '#f0f9ff', color: '#0284c7', fontWeight: 600, fontFamily: FONT }}>UP TO 5</span>
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginBottom: 16, lineHeight: 1.6 }}>
                                Upload short video clips of the person walking or facing the camera. More angles = better accuracy.
                            </div>

                            {/* Drop zone */}
                            <div
                                onClick={() => videoInputRef.current?.click()}
                                onDrop={e => { e.preventDefault(); addVideos(e.dataTransfer.files); }}
                                onDragOver={e => e.preventDefault()}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = C.border2}
                                style={{ border: `2px dashed ${C.border2}`, borderRadius: 12, padding: '22px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 16, transition: 'border-color 0.15s' }}>
                                <div style={{ color: C.light, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                                    </svg>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT }}>Drop videos here or click to browse</div>
                                <div style={{ fontSize: 10, color: C.muted, fontFamily: FONT, marginTop: 4 }}>MP4, MOV, AVI · Unlimited uploads allowed</div>
                                <input ref={videoInputRef} type="file" multiple accept="video/*" style={{ display: 'none' }}
                                    onChange={e => addVideos(e.target.files)} />
                            </div>

                            {/* Video list */}
                            {videoFiles.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {videoFiles.map((v, i) => (
                                        <div key={i} style={{ borderRadius: 10, padding: '8px 12px', border: `1px solid ${v.status === 'error' ? '#fecaca' : C.border}`, background: v.status === 'error' ? '#fef9f9' : '#f9fafb' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {/* Thumbnail */}
                                                <div style={{ width: 56, height: 40, borderRadius: 6, overflow: 'hidden', background: '#e5e7eb', flexShrink: 0 }}>
                                                    {v.thumb
                                                        ? <img src={v.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.light }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" /></svg>
                                                        </div>
                                                    }
                                                </div>
                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.file.name}</div>
                                                    <div style={{ fontSize: 10, color: C.muted, fontFamily: FONT, marginTop: 2 }}>{(v.file.size / 1024 / 1024).toFixed(1)} MB</div>
                                                </div>
                                                {/* Status */}
                                                <div style={{ flexShrink: 0 }}>
                                                    {v.status === 'uploading' && <Spinner size={13} />}
                                                    {v.status === 'done' && <span style={{ color: C.green, fontSize: 14 }}>✓</span>}
                                                    {v.status === 'error' && <span style={{ color: '#dc2626', fontSize: 13 }}>✕</span>}
                                                    {v.status === 'pending' && (
                                                        <button onClick={() => removeVideo(i)}
                                                            style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#e5e7eb', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Inline error */}
                                            {v.status === 'error' && v.errorMsg && (
                                                <div style={{ fontSize: 9, color: '#dc2626', fontFamily: FONT, marginTop: 5, lineHeight: 1.4 }}>
                                                    ⚠ {v.errorMsg}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={() => videoInputRef.current?.click()}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 10, border: `1.5px dashed ${C.border2}`, background: 'transparent', color: C.muted, fontSize: 11, fontFamily: FONT, cursor: 'pointer', transition: 'border-color 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border2}>
                                        + Add another video
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TEST ── */}
                {view === 'test' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>

                        {/* Left: upload */}
                        <div style={{ background: 'white', borderRadius: 14, padding: 22, border: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 6 }}>Test Identity</div>
                            <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginBottom: 16, lineHeight: 1.6 }}>
                                Upload a video clip. The system will check whether this person is registered in the gallery.
                            </div>

                            {/* Drop zone */}
                            <div
                                onClick={() => testInputRef.current?.click()}
                                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleTestFile(e.dataTransfer.files[0]); }}
                                onDragOver={e => e.preventDefault()}
                                style={{ border: `2px dashed ${testThumb ? '#111' : C.border2}`, borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', cursor: 'pointer', position: 'relative', marginBottom: 16, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = testThumb ? '#111' : C.border2}>
                                {testThumb ? (
                                    <>
                                        <img src={testThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" /></svg>
                                            <span style={{ color: 'white', fontSize: 11, fontFamily: FONT }}>{testFile?.name}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: FONT }}>Click to change</span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', color: C.light, padding: 20 }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ marginBottom: 8 }}>
                                            <path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                                        </svg>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#555', fontFamily: FONT }}>Drop or click to upload test video</div>
                                        <div style={{ fontSize: 10, color: '#888', fontFamily: FONT, marginTop: 4 }}>MP4, MOV, AVI</div>
                                    </div>
                                )}
                                <input ref={testInputRef} type="file" accept="video/*" style={{ display: 'none' }}
                                    onChange={e => { if (e.target.files[0]) handleTestFile(e.target.files[0]); }} />
                            </div>

                            <button onClick={runTest} disabled={!testFile || testRunning}
                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: !testFile ? '#f0f0f0' : 'linear-gradient(135deg, #111, #333)', color: !testFile ? C.light : 'white', fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: !testFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: testFile ? '0 4px 14px rgba(0,0,0,0.15)' : 'none' }}>
                                {testRunning ? <><Spinner light />Identifying…</> : 'Identify Person'}
                            </button>
                            <div style={{ marginTop: 10, fontSize: 10, color: C.muted, fontFamily: FONT, textAlign: 'center' }}>
                                {enrolled.length === 0
                                    ? '⚠️ No users with videos registered yet'
                                    : `Comparing against ${enrolled.length} enrolled user${enrolled.length > 1 ? 's' : ''}`}
                            </div>
                        </div>

                        {/* Right: result panel */}
                        <div style={{ background: 'white', borderRadius: 14, padding: 22, border: `1px solid ${C.border}`, minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {!testResult && !testRunning && (
                                <div style={{ textAlign: 'center', color: C.light }}>
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ marginBottom: 12 }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                    <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT }}>Upload a test video and click <strong>Identify Person</strong></div>
                                    <div style={{ fontSize: 11, color: C.light, fontFamily: FONT, marginTop: 4 }}>Results appear here</div>
                                </div>
                            )}

                            {testRunning && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: 56, height: 56, border: `3px solid ${C.border2}`, borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, color: C.text }}>Running detection pipeline…</div>
                                    <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 4 }}>YOLOv8 + EfficientNet-B0</div>
                                </div>
                            )}

                            {testResult && !testRunning && (
                                <div style={{ width: '100%' }}>
                                    {/* Offline / error */}
                                    {testResult.type === 'offline' && (
                                        <div style={{ textAlign: 'center', padding: 20 }}>
                                            <div style={{ fontSize: 32, marginBottom: 10 }}>⚙️</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT }}>Model server offline</div>
                                            <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 6, lineHeight: 1.6 }}>
                                                Run <code style={{ background: '#f5f5f5', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>npm run dev</code> — it auto-starts the Python model server.
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: 10, color: '#f87171', fontFamily: FONT }}>{testResult.message}</div>
                                        </div>
                                    )}

                                    {/* Report */}
                                    {testResult.type === 'report' && (
                                        <>
                                            {/* Summary stats */}
                                            <div style={{ display: 'flex', gap: 10, marginBottom: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                {[
                                                    { label: 'Persons', value: testResult.total_tracks },
                                                    { label: 'Frames', value: testResult.total_frames },
                                                    { label: 'Time', value: `${((testResult.processing_time_ms || 0) / 1000).toFixed(1)}s` },
                                                ].map(({ label, value }) => (
                                                    <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                                                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: FONT }}>{value}</div>
                                                        <div style={{ fontSize: 9, color: C.muted, fontFamily: FONT }}>{label}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {(!testResult.persons_detected || testResult.persons_detected.length === 0) && (
                                                <div style={{ textAlign: 'center', color: C.muted, fontSize: 12, fontFamily: FONT, padding: '20px 0' }}>No persons detected in the video.</div>
                                            )}

                                            {/* Per-person cards */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {testResult.persons_detected?.map((p, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px', borderRadius: 10, border: `1.5px solid ${p.verdict === 'KNOWN' ? 'rgba(34,197,94,0.3)' : '#fecaca'}`, background: p.verdict === 'KNOWN' ? '#f0fdf4' : '#fef2f2', alignItems: 'center' }}>
                                                        {p.thumbnail && (
                                                            <div style={{ width: 48, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#222' }}>
                                                                <img src={`data:image/jpeg;base64,${p.thumbnail}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                        )}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                                                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700, fontFamily: FONT, background: p.verdict === 'KNOWN' ? C.green : C.red, color: 'white' }}>
                                                                    {p.verdict === 'KNOWN' ? '✓ KNOWN' : '⚠ UNKNOWN'}
                                                                </span>
                                                                <span style={{ fontSize: 11, fontWeight: 600, color: C.text, fontFamily: FONT }}>{p.name || 'Unknown Person'}</span>
                                                                <span style={{ fontSize: 10, color: C.muted, fontFamily: FONT }}>{p.frames} frames</span>
                                                            </div>
                                                            <div style={{ height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${p.confidence}%`, background: p.verdict === 'KNOWN' ? C.green : C.red, borderRadius: 10, transition: 'width 0.6s ease' }} />
                                                            </div>
                                                            <div style={{ fontSize: 10, color: p.verdict === 'KNOWN' ? C.green : C.red, fontFamily: FONT, marginTop: 3, fontWeight: 600 }}>{p.confidence}% confidence</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
