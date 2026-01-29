

import { CameraStatus, RecognitionEvent, Employee, User, FootprintData, SystemHealth } from './types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const mapEvent = (data: any): RecognitionEvent => ({
  id: String(data.id || Math.random()),
  timestamp: data.timestamp,
  cameraId: data.camera_id,
  label: data.person_name,
  isEmployee: data.status === 'known',
  confidence: data.confidence,
  imageUrl: undefined
});

const mapCamera = (data: any): CameraStatus => ({
  id: data.id,
  name: data.name,
  status: data.status,
  lastSeen: data.last_seen,
  detectionsToday: 0,
  area: data.area
});

export const api = {
  // Cameras
  fetchCameras: async (): Promise<CameraStatus[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/cameras`);
      const data = await res.json();
      return data.map(mapCamera);
    } catch (e) {
      console.error("Failed to fetch cameras", e);
      return [];
    }
  },

  registerCamera: async (cam: CameraStatus, rtspUrl: string): Promise<boolean> => {
    try {
      const payload = { ...cam, rtsp_url: rtspUrl };
      const res = await fetch(`${BACKEND_URL}/cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return json.status === 'success';
    } catch (e) {
      console.error("Failed to register camera", e);
      return false;
    }
  },

  testCameraConnection: async (rtspUrl: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_URL}/cameras/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test', rtsp_url: rtspUrl })
      });
      const json = await res.json();
      return json.status === 'success';
    } catch (e) {
      return false;
    }
  },

  // Events & Alerts
  fetchEvents: async (): Promise<RecognitionEvent[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/logs`);
      const data = await res.json();
      return data.map(mapEvent);
    } catch (e) {
      console.error("Failed to fetch events", e);
      return [];
    }
  },

  pushEvent: async (event: RecognitionEvent): Promise<void> => {
    // No-op
  },

  // Employees
  fetchEmployees: async (): Promise<Employee[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/employees`);
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("Failed to fetch employees", e);
      return [];
    }
  },

  registerEmployee: async (formData: FormData): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_URL}/employees/register`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      return json.status === 'success';
    } catch (e) {
      console.error("Failed to register employee", e);
      return false;
    }
  },

  // Footprint & Analytics
  fetchFootprintData: async (): Promise<FootprintData[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/footprint`);
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  updateTraffic: async (hour: string, count: number): Promise<void> => {
    // No-op, handled by backend events
  },

  // Utilities
  verifyGaitVideo: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('video', file);
    try {
      const res = await fetch(`${BACKEND_URL}/proxy/analyze`, {
        method: 'POST',
        body: formData
      });
      return await res.json();
    } catch (e) {
      console.error("Verify failed", e);
      return { status: 'failed' };
    }
  },

  // System Health
  fetchSystemHealth: async (): Promise<SystemHealth> => {
    return {
      api: 'healthy',
      mlModel: 'ready',
      analysis: 'active',
      version: '3.0.0-PROD'
    };
  },

  // Auth (Mock for now)
  login: async (email: string): Promise<User> => {
    await sleep(500);
    const user: User = {
      id: "admin-01",
      email: email,
      name: email.split('@')[0].toUpperCase(),
      role: 'Admin'
    };
    localStorage.setItem('ss_user', JSON.stringify(user));
    return user;
  },
  logout: async () => {
    localStorage.removeItem('ss_user');
  },
  getCurrentUser: () => {
    const u = localStorage.getItem('ss_user');
    return u ? JSON.parse(u) : null;
  }
};
