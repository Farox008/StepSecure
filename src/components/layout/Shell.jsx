import React from 'react';
import { Ic } from '../Icons';
import { C, FONT } from '../../constants/theme';
import FeedPanel from './FeedPanel';

export default function Shell({ activePage, setPage, children }) {
    const navItems = [
        { id: "dashboard", Icon: Ic.Home, label: "Dashboard" },
        { id: "activity", Icon: Ic.Activity, label: "Activity" },
        { id: "users", Icon: Ic.Users, label: "Users" },
        { id: "devices", Icon: Ic.Camera, label: "Devices" },
        { id: "search", Icon: Ic.Search, label: "Search" },
    ];

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", background: "white", overflow: "hidden" }}>
            {/* Sidebar */}
            <div style={{ width: 62, background: "white", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, paddingBottom: 16, gap: 4, flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#111", letterSpacing: "-0.5px", marginBottom: 14, fontFamily: FONT }}>ev</div>
                {navItems.map(({ id, Icon, label }) => (
                    <button key={id} title={label} onClick={() => setPage(id)} style={{
                        width: 40, height: 40, borderRadius: 10, border: "none",
                        background: activePage === id ? "#111" : "transparent",
                        color: activePage === id ? "white" : "#999",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.15s ease",
                    }}>
                        <Icon />
                    </button>
                ))}
                <div style={{ marginTop: "auto" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>A</div>
                </div>
            </div>

            {/* Main */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {children}
            </div>

            {/* Right feed panel */}
            <FeedPanel />
        </div>
    );
}
