
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LiveCCTV from './pages/LiveCCTV';
import Alerts from './pages/Alerts';
import Employees from './pages/Employees';
import Footprint from './pages/Footprint';
import Logs from './pages/Logs';
import Login from './pages/Login';
import { User, CameraStatus, RecognitionEvent } from './types';
import { api } from './api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) setUser(currentUser);

    // Initial Load
    refreshData();

    // Start WebSocket Connection
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://localhost:8000/ws');
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Real-time Event:', data);
        // Refresh data to reflect new event in logs/dashboard
        refreshData();
      };
      ws.onopen = () => console.log('Connected to StepSecure Backend');
    } catch (e) {
      console.error("WebSocket Connection Failed", e);
    }

    setIsLoading(false);
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const refreshData = async () => {
    const cams = await api.fetchCameras();
    setCameras(cams);
  };

  const handleLogin = async (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  const handleAddCamera = async (newCam: CameraStatus) => {
    // In a real app, we might need the RTSP URL passed here too.
    // But LiveCCTV doesn't pass it in the interface yet.
    // We should update the interface in LiveCCTV or handle it inside LiveCCTV.
    // Actually, let's make LiveCCTV handle the API call for registration,
    // and just trigger a refresh here.
    refreshData();
  };

  /*
     Correction: LiveCCTV props definition says onAddCamera: (newCam) => void.
     We need to change LiveCCTV to also pass the RTSP URL or handle the save itself.
     Let's handle the save INSIDE LiveCCTV for better encapsulation of the "Test & Save" logic,
     and just use onAddCamera as a "onSuccess" callback to refresh the parent.
  */

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Waking Gait Engine...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard cameras={cameras} />} />
          <Route path="/live" element={<LiveCCTV cameras={cameras} onAddCamera={handleAddCamera} />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/footprint" element={<Footprint />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
