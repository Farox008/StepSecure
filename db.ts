
import { CameraStatus, RecognitionEvent, Employee, User, FootprintData } from './types';
import { MOCK_CAMERAS, MOCK_EVENTS, MOCK_EMPLOYEES, MOCK_FOOTPRINT } from './constants';

const KEYS = {
  CAMERAS: 'ss_cameras',
  EVENTS: 'ss_events',
  EMPLOYEES: 'ss_employees',
  USER: 'ss_user',
  FOOTPRINT: 'ss_footprint'
};

export const db = {
  init: () => {
    if (!localStorage.getItem(KEYS.CAMERAS)) localStorage.setItem(KEYS.CAMERAS, JSON.stringify(MOCK_CAMERAS));
    if (!localStorage.getItem(KEYS.EVENTS)) localStorage.setItem(KEYS.EVENTS, JSON.stringify(MOCK_EVENTS));
    if (!localStorage.getItem(KEYS.EMPLOYEES)) localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(MOCK_EMPLOYEES));
    if (!localStorage.getItem(KEYS.FOOTPRINT)) localStorage.setItem(KEYS.FOOTPRINT, JSON.stringify(MOCK_FOOTPRINT));
  },

  getCameras: (): CameraStatus[] => JSON.parse(localStorage.getItem(KEYS.CAMERAS) || '[]'),
  saveCameras: (cameras: CameraStatus[]) => localStorage.setItem(KEYS.CAMERAS, JSON.stringify(cameras)),

  getEvents: (): RecognitionEvent[] => JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]'),
  addEvent: (event: RecognitionEvent) => {
    const events = db.getEvents();
    localStorage.setItem(KEYS.EVENTS, JSON.stringify([event, ...events].slice(0, 200))); // Keep last 200
  },

  getEmployees: (): Employee[] => JSON.parse(localStorage.getItem(KEYS.EMPLOYEES) || '[]'),
  saveEmployees: (employees: Employee[]) => localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees)),
  
  getFootprint: (): FootprintData[] => JSON.parse(localStorage.getItem(KEYS.FOOTPRINT) || '[]'),
  saveFootprint: (data: FootprintData[]) => localStorage.setItem(KEYS.FOOTPRINT, JSON.stringify(data)),

  getUser: (): User | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: User | null) => {
    if (user) localStorage.setItem(KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(KEYS.USER);
  }
};
