
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
import { db } from './db';
import { api } from './api';
import { startSimulator } from './simulator';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    db.init();
    const currentUser = api.getCurrentUser();
    if (currentUser) setUser(currentUser);
    
    // Initial Load
    refreshData();

    // Start Gait Processing Simulator
    const stopSim = startSimulator((newEvent) => {
       // Optional: Push global notifications here
       console.log('Backend detected event:', newEvent);
       refreshData();
    });

    setIsLoading(false);
    return () => stopSim();
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

  const addCamera = async (newCam: CameraStatus) => {
    await api.registerCamera(newCam);
    refreshData();
  };

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
          <Route path="/live" element={<LiveCCTV cameras={cameras} onAddCamera={addCamera} />} />
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
