
import { CameraStatus, RecognitionEvent, Employee, FootprintData } from './types';

export const MOCK_CAMERAS: CameraStatus[] = [
  { id: 'CAM-01', name: 'Main Entrance Lobby', status: 'online', lastSeen: 'Just now', detectionsToday: 124, area: 'Entrance' },
  { id: 'CAM-02', name: 'Visitor Parking Gate', status: 'online', lastSeen: 'Just now', detectionsToday: 45, area: 'Entrance' },
  { id: 'CAM-03', name: 'Staff Entrance North', status: 'online', lastSeen: 'Just now', detectionsToday: 82, area: 'Entrance' },
  { id: 'CAM-04', name: 'Loading Dock A', status: 'offline', lastSeen: '2h ago', detectionsToday: 12, area: 'Warehouse' },
  { id: 'CAM-05', name: 'Storage Hallway 1', status: 'online', lastSeen: 'Just now', detectionsToday: 34, area: 'Warehouse' },
  { id: 'CAM-06', name: 'Storage Hallway 2', status: 'online', lastSeen: 'Just now', detectionsToday: 21, area: 'Warehouse' },
  { id: 'CAM-07', name: 'Dev Office East', status: 'online', lastSeen: 'Just now', detectionsToday: 95, area: 'Office Block' },
  { id: 'CAM-08', name: 'Meeting Room Alpha', status: 'online', lastSeen: 'Just now', detectionsToday: 12, area: 'Office Block' },
  { id: 'CAM-09', name: 'Cafeteria Main', status: 'online', lastSeen: 'Just now', detectionsToday: 156, area: 'Public Spaces' },
];

export const MOCK_EVENTS: RecognitionEvent[] = [
  { id: 'e1', timestamp: '2023-10-27 09:12:44', cameraId: 'CAM-01', label: 'John Doe', isEmployee: true, confidence: 0.98 },
  { id: 'e2', timestamp: '2023-10-27 10:05:21', cameraId: 'CAM-02', label: 'Intruder', isEmployee: false, confidence: 0.92 },
  { id: 'e3', timestamp: '2023-10-27 11:30:12', cameraId: 'CAM-01', label: 'Jane Smith', isEmployee: true, confidence: 0.99 },
  { id: 'e4', timestamp: '2023-10-27 12:45:00', cameraId: 'CAM-03', label: 'Intruder', isEmployee: false, confidence: 0.88 },
  { id: 'e5', timestamp: '2023-10-27 14:15:33', cameraId: 'CAM-01', label: 'Robert Wilson', isEmployee: true, confidence: 0.96 },
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp1',
    name: 'John Doe',
    totalHours: 165,
    daysPresent: 22,
    lastDetected: '2023-10-27 09:12:44',
    confidenceTrend: [0.97, 0.98, 0.99, 0.98, 0.99],
    recentActivity: [
      { time: '09:12', action: 'Entry: Main Gate' },
      { time: '12:00', action: 'Exit: Main Gate' },
      { time: '13:00', action: 'Entry: Main Gate' },
    ]
  },
  {
    id: 'emp2',
    name: 'Jane Smith',
    totalHours: 180,
    daysPresent: 24,
    lastDetected: '2023-10-27 11:30:12',
    confidenceTrend: [0.99, 0.99, 1.0, 0.99, 0.99],
    recentActivity: [
      { time: '08:45', action: 'Entry: Main Gate' },
      { time: '17:30', action: 'Exit: Main Gate' },
    ]
  },
  {
    id: 'emp3',
    name: 'Robert Wilson',
    totalHours: 140,
    daysPresent: 20,
    lastDetected: '2023-10-27 14:15:33',
    confidenceTrend: [0.94, 0.95, 0.96, 0.96, 0.96],
    recentActivity: [
      { time: '09:05', action: 'Entry: Main Gate' },
      { time: '18:15', action: 'Exit: Main Gate' },
    ]
  }
];

export const MOCK_FOOTPRINT: FootprintData[] = [
  { hour: '08:00', count: 12 },
  { hour: '10:00', count: 45 },
  { hour: '12:00', count: 88 },
  { hour: '14:00', count: 72 },
  { hour: '16:00', count: 95 },
  { hour: '18:00', count: 120 },
  { hour: '20:00', count: 54 },
  { hour: '22:00', count: 18 },
];
