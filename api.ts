
import { db } from './db';
import { CameraStatus, RecognitionEvent, Employee, User, FootprintData, SystemHealth } from './types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Cameras
  fetchCameras: async (): Promise<CameraStatus[]> => {
    await sleep(400);
    return db.getCameras();
  },
  registerCamera: async (cam: CameraStatus): Promise<void> => {
    await sleep(800);
    const cams = db.getCameras();
    db.saveCameras([...cams, cam]);
  },

  // Events & Alerts
  fetchEvents: async (): Promise<RecognitionEvent[]> => {
    await sleep(300);
    return db.getEvents();
  },
  pushEvent: async (event: RecognitionEvent): Promise<void> => {
    db.addEvent(event);
  },

  // Employees
  fetchEmployees: async (): Promise<Employee[]> => {
    await sleep(600);
    return db.getEmployees();
  },
  registerEmployee: async (emp: Employee): Promise<void> => {
    await sleep(1200);
    const emps = db.getEmployees();
    db.saveEmployees([...emps, emp]);
  },

  // Footprint & Analytics
  fetchFootprintData: async (): Promise<FootprintData[]> => {
    await sleep(500);
    return db.getFootprint();
  },
  updateTraffic: async (hour: string, count: number): Promise<void> => {
    const data = db.getFootprint();
    const index = data.findIndex(d => d.hour === hour);
    if (index !== -1) {
      data[index].count += count;
      db.saveFootprint(data);
    }
  },

  // System Health
  fetchSystemHealth: async (): Promise<SystemHealth> => {
    await sleep(200);
    return {
      api: 'healthy',
      mlModel: 'ready',
      analysis: 'active',
      version: '2.4.1-stable'
    };
  },

  // Auth
  login: async (email: string): Promise<User> => {
    await sleep(1000);
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: email,
      name: email.split('@')[0].toUpperCase(),
      role: 'Admin'
    };
    db.setUser(user);
    return user;
  },
  logout: async () => {
    await sleep(200);
    db.setUser(null);
  },
  getCurrentUser: () => db.getUser()
};
