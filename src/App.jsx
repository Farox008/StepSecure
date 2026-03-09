import React, { useState } from 'react';
import Shell from './components/layout/Shell';
import DashboardPage from './pages/DashboardPage';
import ActivityPage from './pages/ActivityPage';
import UsersPage from './pages/UsersPage';
import DevicesPage from './pages/DevicesPage';

export default function App() {
  const [page, setPage] = useState("dashboard");

  const pages = {
    dashboard: <DashboardPage />,
    activity: <ActivityPage />,
    users: <UsersPage />,
    devices: <DevicesPage />,
    search: <DashboardPage />, // Fallback or duplicate for now
  };

  return (
    <Shell activePage={page} setPage={setPage}>
      <div key={page} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", animation: "fadeIn 0.22s ease" }}>
        {pages[page]}
      </div>
    </Shell>
  );
}
