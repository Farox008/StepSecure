/**
 * VideoStream — HLS stream player with graceful fallback
 *
 * Priority:
 *   1. If `hlsUrl` is provided → try to play HLS via hls.js (or native on Safari)
 *   2. If stream fails or `hlsUrl` is absent → show thumbnail image
 *   3. If neither → show a styled "No Stream" placeholder
 */
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { FONT } from '../constants/theme';

const STATE = { LOADING: 'loading', PLAYING: 'playing', FALLBACK: 'fallback', PLACEHOLDER: 'placeholder' };

export default function VideoStream({ hlsUrl, thumbnail, camName, status }) {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [streamState, setStreamState] = useState(
        hlsUrl ? STATE.LOADING : thumbnail ? STATE.FALLBACK : STATE.PLACEHOLDER
    );

    useEffect(() => {
        if (!hlsUrl) {
            setStreamState(thumbnail ? STATE.FALLBACK : STATE.PLACEHOLDER);
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        setStreamState(STATE.LOADING);

        const onError = () => {
            setStreamState(thumbnail ? STATE.FALLBACK : STATE.PLACEHOLDER);
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        };

        // Safari has native HLS support
        if (!Hls.isSupported() && video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = hlsUrl;
            video.addEventListener('loadedmetadata', () => setStreamState(STATE.PLAYING), { once: true });
            video.addEventListener('error', onError, { once: true });
            return;
        }

        if (!Hls.isSupported()) { onError(); return; }

        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 5,
            maxBufferLength: 10,
            liveSyncDurationCount: 2,
        });
        hlsRef.current = hls;

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => { });
            setStreamState(STATE.PLAYING);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) onError();
        });

        return () => {
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        };
    }, [hlsUrl, thumbnail]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#111' }}>

            {/* The actual HLS video element (hidden until playing) */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    display: streamState === STATE.PLAYING ? 'block' : 'none',
                }}
            />

            {/* Thumbnail fallback */}
            {streamState === STATE.FALLBACK && thumbnail && (
                <img
                    src={thumbnail}
                    alt={camName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}

            {/* No-stream placeholder */}
            {streamState === STATE.PLACEHOLDER && (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', gap: 8 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                    </svg>
                    <span style={{ color: '#555', fontSize: 11, fontFamily: FONT }}>No stream configured</span>
                </div>
            )}

            {/* Loading spinner overlay */}
            {streamState === STATE.LOADING && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: FONT, letterSpacing: 0.5 }}>Connecting…</span>
                    </div>
                </div>
            )}

            {/* RTSP stream source badge */}
            {hlsUrl && streamState === STATE.PLAYING && (
                <div style={{ position: 'absolute', bottom: 8, right: 10, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '2px 7px', borderRadius: 20 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'pulse 2s infinite' }} />
                    <span style={{ color: 'white', fontSize: 9, fontWeight: 600, letterSpacing: 1, fontFamily: FONT }}>RTSP</span>
                </div>
            )}
        </div>
    );
}
